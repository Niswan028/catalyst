// Shared service for seeding demo data for evaluation and judge demos
import bcrypt from 'bcryptjs';
import { createServiceRoleClient } from './supabase/authServer';

export interface SeedResult {
  success: boolean;
  message: string;
  usersSeeded: number;
  medicationsSeeded: number;
  appointmentsSeeded: number;
  passcode: string;
  details?: Record<string, unknown>;
}

export async function runDemoSeed(): Promise<SeedResult> {
  const supabase = createServiceRoleClient();

  // Helper to ensure auth and public users exist
  async function ensureUser(
    email: string,
    pass: string,
    fullName: string,
    role: 'elder' | 'caregiver'
  ) {
    let authId: string | null = null;

    try {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) {
        authId = existing.id;
        // Ensure password is up to date
        await supabase.auth.admin.updateUserById(existing.id, {
          password: pass,
          user_metadata: { full_name: fullName, role },
        });
      } else {
        const { data: created, error } = await supabase.auth.admin.createUser({
          email,
          password: pass,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
        });
        if (error) throw error;
        authId = created.user.id;
      }
    } catch {
      // In local/mock environments, use a deterministic UUID if admin auth isn't connected
      authId = email.includes('eleanor')
        ? '11111111-1111-4111-a111-111111111111'
        : email.includes('marcus')
        ? '22222222-2222-4222-a222-222222222222'
        : email.includes('dr.patel')
        ? '33333333-3333-4333-a333-333333333333'
        : email.includes('clara')
        ? '44444444-4444-4444-a444-444444444444'
        : '55555555-5555-4555-a555-555555555555';
    }

    // Upsert into public.users
    await supabase.from('users').upsert(
      {
        id: authId,
        email,
        full_name: fullName,
        role: role === 'elder' ? 'elderly_user' : 'caregiver',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    return { id: authId, email, fullName, role };
  }

  // 1. Create demo users
  const defaultPassword = 'Password123!Secure';
  const eleanor = await ensureUser('eleanor.vance.demo@gmail.com', defaultPassword, 'Eleanor Vance', 'elder');
  const marcus = await ensureUser('marcus.caregiver.demo@gmail.com', defaultPassword, 'Marcus Vance', 'caregiver');
  const drPatel = await ensureUser('dr.patel.demo@gmail.com', defaultPassword, 'Dr. Anita Patel, MD', 'caregiver');
  const clara = await ensureUser('clara.vance.demo@gmail.com', defaultPassword, 'Clara Vance', 'caregiver');
  const david = await ensureUser('david.vance.demo@gmail.com', defaultPassword, 'David Vance', 'caregiver');

  // 2. Set up Vance Family Care Circle
  let circleId = 'c1111111-1111-4111-a111-111111111111';
  const { data: existingCircle } = await supabase
    .from('care_circles')
    .select('id')
    .eq('elder_id', eleanor.id)
    .maybeSingle();

  if (existingCircle) {
    circleId = existingCircle.id;
  } else {
    const { data: createdCircle } = await supabase
      .from('care_circles')
      .upsert({
        id: circleId,
        elder_id: eleanor.id,
        name: 'Vance Family Care Circle',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (createdCircle?.id) circleId = createdCircle.id;
  }

  // 3. Circle Members
  const circleMembers = [
    {
      circle_id: circleId,
      user_id: eleanor.id,
      role: 'elder',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: true },
      notification_preferences: { upcoming_doses: true, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: circleId,
      user_id: marcus.id,
      role: 'editor',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: true },
      notification_preferences: { upcoming_doses: true, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: circleId,
      user_id: drPatel.id,
      role: 'editor',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: false, insights: true },
      notification_preferences: { upcoming_doses: false, missed_doses: true, appointments: true, weekly_digest: true },
    },
    {
      circle_id: circleId,
      user_id: clara.id,
      role: 'viewer',
      status: 'approved',
      permissions: { medications: true, appointments: true, health_checkins: true, voice_messages: true, insights: false },
      notification_preferences: { upcoming_doses: true, missed_doses: false, appointments: true, weekly_digest: false },
    },
    {
      circle_id: circleId,
      user_id: david.id,
      role: 'viewer',
      status: 'pending', // Pending elder approval demonstration
      permissions: { medications: true, appointments: false, health_checkins: false, voice_messages: false, insights: false },
      notification_preferences: { upcoming_doses: false, missed_doses: false, appointments: false, weekly_digest: false },
    },
  ];

  await supabase.from('circle_members').delete().eq('circle_id', circleId);
  await supabase.from('circle_members').insert(circleMembers);

  // Synchronize caregiver links
  await supabase.from('caregiver_links').delete().in('caregiver_id', [marcus.id, drPatel.id]);
  await supabase.from('caregiver_links').insert([
    { caregiver_id: marcus.id, elderly_user_id: eleanor.id },
    { caregiver_id: drPatel.id, elderly_user_id: eleanor.id },
  ]);

  // 4. Passcode Generation (Active for 7 days)
  const evalPasscode = 'CARE-2026';
  const hashedPasscode = await bcrypt.hash(evalPasscode, 10);
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  await supabase.from('invite_codes').delete().eq('circle_id', circleId);
  await supabase.from('invite_codes').insert({
    circle_id: circleId,
    created_by: eleanor.id,
    code_hash: hashedPasscode,
    code_prefix: 'CA',
    role: 'editor',
    max_uses: 10,
    uses_count: 1,
    expires_at: expiry.toISOString(),
    is_revoked: false,
  });

  // 5. Eleanor's Medications
  await supabase.from('medications').delete().eq('user_id', eleanor.id);
  const { data: meds } = await supabase
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
        total_stock: 4, // Critical refill alert
        low_stock_threshold: 7,
        is_active: true,
      },
    ])
    .select();

  // Stock alert
  const atorvastatin = meds?.find((m) => m.name === 'Atorvastatin');
  if (atorvastatin) {
    await supabase.from('stock_alerts').delete().eq('medication_id', atorvastatin.id);
    await supabase.from('stock_alerts').insert({
      user_id: eleanor.id,
      medication_id: atorvastatin.id,
      message: 'Atorvastatin stock is critically low (4 doses remaining, threshold 7). Refill needed soon.',
      is_resolved: false,
    });
  }

  // 6. Historical 7-day adherence logs (96% adherence)
  if (meds && meds.length > 0) {
    const logs = [];
    const now = new Date();
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - dayOffset);
      const dateStr = targetDate.toISOString().split('T')[0];

      for (const med of meds) {
        const isSkipped = dayOffset === 2 && med.name === 'Metformin';
        logs.push({
          medication_id: med.id,
          user_id: eleanor.id,
          status: isSkipped ? 'skipped' : 'taken',
          scheduled_time: `${dateStr}T${med.time}:00.000Z`,
          logged_at: `${dateStr}T${med.time}:05.000Z`,
        });
      }
    }
    await supabase.from('medication_logs').delete().eq('user_id', eleanor.id);
    await supabase.from('medication_logs').insert(logs);
  }

  // 7. Appointments
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  inThreeDays.setHours(10, 30, 0, 0);

  const inTenDays = new Date();
  inTenDays.setDate(inTenDays.getDate() + 10);
  inTenDays.setHours(14, 0, 0, 0);

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  twoWeeksAgo.setHours(11, 0, 0, 0);

  await supabase.from('appointments').delete().eq('circle_id', circleId);
  const { data: appointments } = await supabase
    .from('appointments')
    .insert([
      {
        circle_id: circleId,
        doctor_name: 'Dr. Anita Patel, MD',
        specialty: 'Geriatric Cardiology',
        location: 'Metro Health Hospital, Suite 402',
        datetime: inThreeDays.toISOString(),
        notes: 'Follow-up on blood pressure control and Lisinopril tolerance test.',
        status: 'upcoming',
        created_by: marcus.id,
      },
      {
        circle_id: circleId,
        doctor_name: 'Dr. Robert Miller, OD',
        specialty: 'Ophthalmology',
        location: 'Vision Eye Care Center, 120 Main St',
        datetime: inTenDays.toISOString(),
        notes: 'Annual diabetic retinopathy screening and lens assessment.',
        status: 'upcoming',
        created_by: eleanor.id,
      },
      {
        circle_id: circleId,
        doctor_name: 'Dr. Sarah Jenkins',
        specialty: 'Primary Care Physician',
        location: 'Oakridge Community Clinic',
        datetime: twoWeeksAgo.toISOString(),
        notes: 'Routine blood panel, vitamin D review, and general wellness exam.',
        status: 'done',
        created_by: eleanor.id,
      },
    ])
    .select();

  // 8. Daily Summary & Audit Log
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('daily_summaries').delete().eq('user_id', eleanor.id);
  await supabase.from('daily_summaries').insert({
    user_id: eleanor.id,
    date: today,
    mood_summary: 'Energized and feeling healthy',
    symptoms: [],
    medication_adherence_rate: 96,
    total_checkins: 1,
  });

  await supabase.from('audit_log').insert([
    {
      circle_id: circleId,
      actor_id: eleanor.id,
      action: 'demo_data_seeded',
      resource_type: 'system',
      details: {
        passcode: evalPasscode,
        personaCount: 5,
        medicationCount: meds?.length || 4,
        appointmentCount: appointments?.length || 3,
      },
    },
  ]);

  return {
    success: true,
    message: 'Demo dataset successfully loaded and synchronized!',
    usersSeeded: 5,
    medicationsSeeded: meds?.length || 4,
    appointmentsSeeded: appointments?.length || 3,
    passcode: evalPasscode,
  };
}
