// Comprehensive seed script for CareConnect platform
// Run via: npm run seed
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

// Helper to ensure an auth user exists and return their record
async function ensureUser(email, password, fullName, role) {
  // Check auth
  const { data: listData } = await supabase.auth.admin.listUsers();
  let existingAuth = listData?.users?.find((u) => u.email === email);

  if (!existingAuth) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (error) {
      console.error(`Failed to create auth user ${email}:`, error);
      throw error;
    }
    existingAuth = created.user;
  }

  // Upsert into public.users
  const { data: publicUser, error: pubErr } = await supabase
    .from('users')
    .upsert({
      id: existingAuth.id,
      email: email,
      full_name: fullName,
      role: role === 'elder' ? 'elderly_user' : 'caregiver',
    })
    .select()
    .single();

  if (pubErr) {
    console.error(`Failed to upsert public.users for ${email}:`, pubErr);
  }

  return publicUser || { id: existingAuth.id, email, full_name: fullName, role };
}

async function runSeed() {
  console.log('🌱 Starting Rich Multi-User CareConnect Database Seed...');

  // 1. Ensure all platform demo users exist
  const eleanor = await ensureUser(
    'eleanor.vance.demo@gmail.com',
    'Password123!Secure',
    'Eleanor Vance',
    'elder'
  );
  const marcus = await ensureUser(
    'marcus.caregiver.demo@gmail.com',
    'Password123!Secure',
    'Marcus Vance',
    'caregiver'
  );
  const drPatel = await ensureUser(
    'dr.patel.demo@gmail.com',
    'Password123!Secure',
    'Dr. Anita Patel, MD',
    'caregiver'
  );
  const clara = await ensureUser(
    'clara.vance.demo@gmail.com',
    'Password123!Secure',
    'Clara Vance',
    'caregiver'
  );
  const david = await ensureUser(
    'david.vance.demo@gmail.com',
    'Password123!Secure',
    'David Vance',
    'caregiver'
  );
  const arthur = await ensureUser(
    'arthur.chen.demo@gmail.com',
    'Password123!Secure',
    'Arthur Chen',
    'elder'
  );
  const meilin = await ensureUser(
    'meilin.chen.demo@gmail.com',
    'Password123!Secure',
    'Meilin Chen',
    'caregiver'
  );

  console.log('✅ Verified 7 Demo Users across Elder, Family, and Clinician roles');

  // 2. Set up Care Circles
  // Circle A: Vance Family Care Circle
  let vanceCircleId = null;
  const { data: existingVanceCircle } = await supabase
    .from('care_circles')
    .select('id')
    .eq('elder_id', eleanor.id)
    .maybeSingle();

  if (existingVanceCircle) {
    vanceCircleId = existingVanceCircle.id;
  } else {
    const { data: newCircle } = await supabase
      .from('care_circles')
      .insert({
        elder_id: eleanor.id,
        name: 'Vance Family Care Circle',
      })
      .select('id')
      .single();
    vanceCircleId = newCircle?.id;
  }

  // Circle B: Chen Family Care Circle
  let chenCircleId = null;
  const { data: existingChenCircle } = await supabase
    .from('care_circles')
    .select('id')
    .eq('elder_id', arthur.id)
    .maybeSingle();

  if (existingChenCircle) {
    chenCircleId = existingChenCircle.id;
  } else {
    const { data: newCircle } = await supabase
      .from('care_circles')
      .insert({
        elder_id: arthur.id,
        name: 'Chen Family Care Circle',
      })
      .select('id')
      .single();
    chenCircleId = newCircle?.id;
  }

  console.log(`✅ Care Circles: Vance (${vanceCircleId}), Chen (${chenCircleId})`);

  // 3. Configure Circle Memberships
  // Vance Circle Members
  const vanceMembers = [
    {
      circle_id: vanceCircleId,
      user_id: eleanor.id,
      role: 'elder',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: true },
      notification_preferences: { upcoming_doses: true, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: vanceCircleId,
      user_id: marcus.id,
      role: 'editor',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: true },
      notification_preferences: { upcoming_doses: true, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: vanceCircleId,
      user_id: drPatel.id,
      role: 'editor',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: false, insights: true },
      notification_preferences: { upcoming_doses: false, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: vanceCircleId,
      user_id: clara.id,
      role: 'viewer',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: false },
      notification_preferences: { upcoming_doses: true, missed_doses: false, appointments: true, weekly_digest: false },
    },
    {
      circle_id: vanceCircleId,
      user_id: david.id,
      role: 'viewer',
      status: 'pending', // Demonstrates Elder Approval Flow
      permissions: { medications: true, appointments: false, health_checkins: false, voice_messages: false, insights: false },
      notification_preferences: { upcoming_doses: false, missed_doses: false, appointments: false, weekly_digest: false },
    },
  ];

  await supabase.from('circle_members').delete().eq('circle_id', vanceCircleId);
  const { error: memberErr } = await supabase.from('circle_members').insert(vanceMembers);
  if (memberErr) console.error('Error inserting vance members:', memberErr);
  else console.log('✅ Vance Circle: 5 members configured (including pending approval gate)');

  // Chen Circle Members
  const chenMembers = [
    {
      circle_id: chenCircleId,
      user_id: arthur.id,
      role: 'elder',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: true },
      notification_preferences: { upcoming_doses: true, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: chenCircleId,
      user_id: meilin.id,
      role: 'editor',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: true },
      notification_preferences: { upcoming_doses: true, missed_doses: true, appointments: true, weekly_digest: true },
    },
  ];

  await supabase.from('circle_members').delete().eq('circle_id', chenCircleId);
  await supabase.from('circle_members').insert(chenMembers);
  console.log('✅ Chen Circle: 2 members configured');

  // 4. Caregiver Links (legacy support)
  await supabase.from('caregiver_links').delete().in('caregiver_id', [marcus.id, drPatel.id, meilin.id]);
  await supabase.from('caregiver_links').insert([
    { caregiver_id: marcus.id, elderly_user_id: eleanor.id },
    { caregiver_id: drPatel.id, elderly_user_id: eleanor.id },
    { caregiver_id: meilin.id, elderly_user_id: arthur.id },
  ]);
  console.log('✅ Legacy caregiver links synchronized');

  // 5. Active Passcode for live evaluation
  const passcode = 'CARE-2026';
  const hashedPasscode = await bcrypt.hash(passcode, 10);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  await supabase.from('invite_codes').delete().eq('circle_id', vanceCircleId);
  await supabase.from('invite_codes').insert({
    circle_id: vanceCircleId,
    created_by: eleanor.id,
    code_hash: hashedPasscode,
    code_prefix: 'CA',
    role: 'editor',
    max_uses: 10,
    uses_count: 1,
    expires_at: expiry.toISOString(),
    is_revoked: false,
  });
  console.log(`✅ Seeded active evaluation passcode: ${passcode} (expires in 7 days)`);

  // 6. Medications for Eleanor
  await supabase.from('medications').delete().eq('user_id', eleanor.id);
  const { data: eleanorMeds } = await supabase
    .from('medications')
    .insert([
      {
        user_id: eleanor.id,
        name: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        total_stock: 28,
        low_stock_threshold: 7,
        is_active: true,
      },
      {
        user_id: eleanor.id,
        name: 'Metformin',
        dosage: '500mg',
        time: '12:30',
        total_stock: 45,
        low_stock_threshold: 10,
        is_active: true,
      },
      {
        user_id: eleanor.id,
        name: 'Vitamin D3',
        dosage: '1000 IU',
        time: '09:00',
        total_stock: 60,
        low_stock_threshold: 10,
        is_active: true,
      },
      {
        user_id: eleanor.id,
        name: 'Atorvastatin',
        dosage: '20mg',
        time: '21:00',
        total_stock: 4, // Triggers low-stock alert!
        low_stock_threshold: 7,
        is_active: true,
      },
    ])
    .select();

  // Low Stock Alert for Eleanor
  const atorvastatin = eleanorMeds?.find((m) => m.name === 'Atorvastatin');
  if (atorvastatin) {
    await supabase.from('stock_alerts').delete().eq('medication_id', atorvastatin.id);
    await supabase.from('stock_alerts').insert({
      user_id: eleanor.id,
      medication_id: atorvastatin.id,
      message: 'Atorvastatin stock is critically low (4 doses remaining, threshold 7). Refill needed soon.',
      is_resolved: false,
    });
    console.log('✅ Seeded low-stock alert for Atorvastatin');
  }

  // Medications for Arthur Chen
  await supabase.from('medications').delete().eq('user_id', arthur.id);
  await supabase.from('medications').insert([
    {
      user_id: arthur.id,
      name: 'Amlodipine',
      dosage: '5mg',
      time: '08:30',
      total_stock: 30,
      low_stock_threshold: 7,
      is_active: true,
    },
    {
      user_id: arthur.id,
      name: 'Aspirin Cardio',
      dosage: '81mg',
      time: '09:00',
      total_stock: 90,
      low_stock_threshold: 15,
      is_active: true,
    },
    {
      user_id: arthur.id,
      name: 'Metoprolol',
      dosage: '25mg',
      time: '20:00',
      total_stock: 14,
      low_stock_threshold: 7,
      is_active: true,
    },
  ]);
  console.log('✅ Seeded medications for Eleanor Vance and Arthur Chen');

  // 7. 7-Day Adherence History for Eleanor
  if (eleanorMeds && eleanorMeds.length > 0) {
    const logs = [];
    const now = new Date();

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - dayOffset);
      const dateStr = targetDate.toISOString().split('T')[0];

      for (const med of eleanorMeds) {
        // High adherence simulation: 96% taken, 1 skipped on day -2
        const isSkipped = dayOffset === 2 && med.name === 'Metformin';
        const scheduledDateTime = new Date(`${dateStr}T${med.time}:00.000Z`).toISOString();
        const loggedDateTime = new Date(`${dateStr}T${med.time}:05.000Z`).toISOString();

        logs.push({
          medication_id: med.id,
          user_id: eleanor.id,
          status: isSkipped ? 'skipped' : 'taken',
          scheduled_time: scheduledDateTime,
          logged_at: loggedDateTime,
        });
      }
    }

    await supabase.from('medication_logs').delete().eq('user_id', eleanor.id);
    await supabase.from('medication_logs').insert(logs);
    console.log(`✅ Seeded ${logs.length} historical medication adherence logs`);
  }

  // 8. Daily Health Summaries & Check-ins
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('daily_summaries').delete().eq('user_id', eleanor.id);
  await supabase.from('daily_summaries').insert([
    {
      user_id: eleanor.id,
      date: today,
      mood_summary: 'Feeling healthy, energetic, and rested today. Morning walk completed.',
      symptoms: ['Mild joint stiffness in morning'],
      medication_adherence_rate: 96.0,
      total_checkins: 2,
    },
  ]);

  // Health Check-Ins
  await supabase.from('health_checkins').delete().eq('user_id', eleanor.id);
  await supabase.from('health_checkins').insert([
    {
      user_id: eleanor.id,
      transcript: 'Good morning! I slept well for 7.5 hours. My blood pressure this morning was 122 over 78. Feeling ready for my garden walk.',
      detected_keywords: ['sleep', 'blood pressure', 'garden', 'walk'],
      mood: 'good',
    },
    {
      user_id: eleanor.id,
      transcript: 'Had lunch with Clara. Took Metformin on time. Energy is good, slight headache earlier but drank two glasses of water and feeling much better.',
      detected_keywords: ['lunch', 'metformin', 'water', 'energy'],
      mood: 'good',
    },
    {
      user_id: eleanor.id,
      transcript: 'Evening check-in: rested afternoon, prepared for tomorrow morning appointment with Dr. Jenkins.',
      detected_keywords: ['rested', 'appointment', 'evening'],
      mood: 'positive',
    },
  ]);
  console.log('✅ Seeded 3 health check-in transcripts');

  // 9. Doctor Appointments
  await supabase.from('appointments').delete().eq('circle_id', vanceCircleId);
  const d1 = new Date(); d1.setDate(d1.getDate() + 1); d1.setHours(10, 0, 0, 0);
  const d2 = new Date(); d2.setDate(d2.getDate() + 4); d2.setHours(14, 30, 0, 0);
  const d3 = new Date(); d3.setDate(d3.getDate() + 12); d3.setHours(11, 15, 0, 0);

  await supabase.from('appointments').insert([
    {
      circle_id: vanceCircleId,
      doctor_name: 'Dr. Sarah Jenkins',
      specialty: 'Cardiology & Hypertension',
      location: 'City General Hospital, Suite 302',
      datetime: d1.toISOString(),
      notes: '6-month blood pressure review and EKG follow-up. Bring daily readings log.',
      status: 'upcoming',
    },
    {
      circle_id: vanceCircleId,
      doctor_name: 'Dr. Anita Patel, MD',
      specialty: 'Geriatric Comprehensive Review',
      location: 'Metro Senior Health Pavilion, Room 410',
      datetime: d2.toISOString(),
      notes: 'Routine bone density follow-up and overall prescription regimen optimization.',
      status: 'upcoming',
    },
    {
      circle_id: vanceCircleId,
      doctor_name: 'Dr. Robert Chen',
      specialty: 'Ophthalmology & Vision Care',
      location: 'Eye Care Associates, Suite 105',
      datetime: d3.toISOString(),
      notes: 'Annual dilated eye examination and retinal screening.',
      status: 'upcoming',
    },
  ]);
  console.log('✅ Seeded 3 doctor appointments for Eleanor Vance');

  // 10. Audit Logs (Passcode, role changes, dose logs)
  await supabase.from('audit_log').delete().eq('circle_id', vanceCircleId);
  await supabase.from('audit_log').insert([
    {
      circle_id: vanceCircleId,
      actor_id: eleanor.id,
      action: 'invite_code_generated',
      resource_type: 'invite_code',
      resource_id: 'CARE-2026',
      details: { role: 'editor', max_uses: 10, expiry_days: 7 },
    },
    {
      circle_id: vanceCircleId,
      actor_id: marcus.id,
      action: 'member_joined',
      resource_type: 'circle_members',
      resource_id: marcus.id,
      details: { role: 'editor', passcode_prefix: 'CA' },
    },
    {
      circle_id: vanceCircleId,
      actor_id: drPatel.id,
      action: 'appointment_created',
      resource_type: 'appointments',
      resource_id: 'dr_patel_review',
      details: { doctor: 'Dr. Anita Patel, MD', specialty: 'Geriatrics' },
    },
    {
      circle_id: vanceCircleId,
      actor_id: marcus.id,
      action: 'medication_logged',
      resource_type: 'medication_logs',
      resource_id: 'dose_lisinopril',
      details: { medication: 'Lisinopril 10mg', status: 'taken' },
    },
    {
      circle_id: vanceCircleId,
      actor_id: david.id,
      action: 'member_join_requested',
      resource_type: 'circle_members',
      resource_id: david.id,
      details: { role: 'viewer', status: 'pending' },
    },
    {
      circle_id: vanceCircleId,
      actor_id: eleanor.id,
      action: 'stock_alert_reviewed',
      resource_type: 'stock_alerts',
      resource_id: 'alert_atorvastatin',
      details: { medication: 'Atorvastatin', stock: 4, refill_requested: true },
    },
  ]);
  console.log('✅ Seeded 6 comprehensive audit trail entries');

  // 11. Seed Voice Messages between Eleanor and Marcus
  await supabase.from('voice_messages').delete().or(`sender_id.eq.${eleanor.id},recipient_id.eq.${eleanor.id}`);
  await supabase.from('voice_messages').insert([
    {
      sender_id: marcus.id,
      recipient_id: eleanor.id,
      audio_url: 'https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3',
      duration_seconds: 5,
      is_read: true,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      sender_id: eleanor.id,
      recipient_id: marcus.id,
      audio_url: 'https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3',
      duration_seconds: 4,
      is_read: true,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);
  console.log('✅ Seeded 2 sample voice messages');

  console.log('\n🎉 Comprehensive database seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Accounts:');
  console.log('👵 Elder: eleanor.vance.demo@gmail.com / Password123!Secure');
  console.log('👨‍⚕️ Caregiver Son: marcus.caregiver.demo@gmail.com / Password123!Secure');
  console.log('🩺 Clinician: dr.patel.demo@gmail.com / Password123!Secure');
  console.log('👧 Granddaughter: clara.vance.demo@gmail.com / Password123!Secure');
  console.log('👨 Pending Son: david.vance.demo@gmail.com / Password123!Secure');
  console.log('👴 Elder (Chen Circle): arthur.chen.demo@gmail.com / Password123!Secure');
  console.log('Passcode for Live Evaluation: CARE-2026');
  console.log('----------------------------------------------------');
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
