// Seed script for CareConnect platform
// Run via: npm run seed
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually if not in process.env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function runSeed() {
  console.log('🌱 Starting CareConnect Database Seed...');

  // 1. Check or fetch Eleanor Vance
  const { data: elder, error: elderErr } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('email', 'eleanor.vance.demo@gmail.com')
    .maybeSingle();

  if (elderErr || !elder) {
    console.warn('⚠️ Eleanor Vance user not found in public.users. Creating test elder user...');
    // Create elder profile
    const { data: createdElder, error: createErr } = await supabase
      .from('users')
      .upsert({
        email: 'eleanor.vance.demo@gmail.com',
        full_name: 'Eleanor Vance',
        role: 'elderly_user',
      })
      .select()
      .single();

    if (createErr) {
      console.error('Failed to create elder profile:', createErr);
      process.exit(1);
    }
  }

  const elderUser = elder || (await supabase.from('users').select('id').eq('email', 'eleanor.vance.demo@gmail.com').single()).data;
  console.log('✅ Elder User confirmed:', elderUser.id);

  // 2. Vance Family Care Circle
  const { data: existingCircle } = await supabase
    .from('care_circles')
    .select('id')
    .eq('elder_id', elderUser.id)
    .maybeSingle();

  let circleId = existingCircle?.id;
  if (!circleId) {
    const { data: newCircle, error: circleErr } = await supabase
      .from('care_circles')
      .insert({
        elder_id: elderUser.id,
        name: 'Vance Family Care Circle',
      })
      .select('id')
      .single();

    if (circleErr) {
      console.error('Failed to create circle:', circleErr);
    } else {
      circleId = newCircle.id;
    }
  }
  console.log('✅ Care Circle active:', circleId);

  // Circle member entry for Elder
  if (circleId) {
    await supabase.from('circle_members').upsert({
      circle_id: circleId,
      user_id: elderUser.id,
      role: 'owner',
      status: 'approved',
      permissions: {
        medications: true,
        appointments: true,
        health_checkins: true,
        voice_messages: true,
        insights: true,
      },
      notification_preferences: {
        upcoming_doses: true,
        missed_doses: true,
        appointments: true,
        weekly_digest: true,
      },
    }, { onConflict: 'circle_id,user_id' });
  }

  // 3. Medications
  const meds = [
    {
      user_id: elderUser.id,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      time: '08:00',
      instructions: 'Take in the morning with a full glass of water',
      total_stock: 28,
      refill_threshold: 7,
      is_active: true,
    },
    {
      user_id: elderUser.id,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      time: '12:30',
      instructions: 'Take with lunch to avoid stomach irritation',
      total_stock: 45,
      refill_threshold: 10,
      is_active: true,
    },
    {
      user_id: elderUser.id,
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      time: '21:00',
      instructions: 'Take at bedtime',
      total_stock: 5, // Low stock triggers alert!
      refill_threshold: 7,
      is_active: true,
    },
    {
      user_id: elderUser.id,
      name: 'Vitamin D3',
      dosage: '1000 IU',
      frequency: 'Once daily',
      time: '09:00',
      instructions: 'Take with breakfast',
      total_stock: 60,
      refill_threshold: 10,
      is_active: true,
    },
  ];

  for (const med of meds) {
    const { data: existingMed } = await supabase
      .from('medications')
      .select('id')
      .eq('user_id', elderUser.id)
      .eq('name', med.name)
      .maybeSingle();

    if (!existingMed) {
      const { data: insertedMed } = await supabase
        .from('medications')
        .insert(med)
        .select('id')
        .single();
      console.log(`✅ Seeded medication: ${med.name}`);

      // Seed low stock alert for Atorvastatin
      if (med.name === 'Atorvastatin' && insertedMed) {
        await supabase.from('stock_alerts').insert({
          user_id: elderUser.id,
          medication_id: insertedMed.id,
          message: 'Atorvastatin stock is critically low (5 doses remaining, threshold is 7). Refill needed soon.',
          is_resolved: false,
        });
      }
    }
  }

  // 4. Appointments
  if (circleId) {
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 2);
    futureDate1.setHours(10, 30, 0, 0);

    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 5);
    futureDate2.setHours(14, 0, 0, 0);

    const { data: existingAppts } = await supabase
      .from('appointments')
      .select('id')
      .eq('circle_id', circleId);

    if (!existingAppts || existingAppts.length === 0) {
      await supabase.from('appointments').insert([
        {
          circle_id: circleId,
          doctor_name: 'Dr. Sarah Jenkins',
          specialty: 'Cardiology',
          location: 'City General Hospital, Suite 302',
          datetime: futureDate1.toISOString(),
          notes: 'Routine 6-month blood pressure review and EKG follow-up.',
          status: 'upcoming',
        },
        {
          circle_id: circleId,
          doctor_name: 'Dr. Robert Chen',
          specialty: 'Ophthalmology & Vision Care',
          location: 'Mercy Eye Clinic, Suite 105',
          datetime: futureDate2.toISOString(),
          notes: 'Annual dilated eye exam and diabetic retinopathy screening.',
          status: 'upcoming',
        },
      ]);
      console.log('✅ Seeded 2 upcoming doctor appointments');
    }
  }

  console.log('🎉 CareConnect database seed completed successfully!');
}

runSeed().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
