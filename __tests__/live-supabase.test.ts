import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local if present
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  const envLocalPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val;
    }
  }
}

describe('Live Supabase Project Verification', () => {
  const isConfigured = supabaseUrl.includes('supabase.co') && serviceRoleKey.length > 10;

  it('connects to the live Supabase database successfully', async () => {
    if (!isConfigured) {
      console.log('Skipping live test: Supabase URL/key not present in env');
      return;
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.from('users').select('id').limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('verifies all required tables exist in the public schema', async () => {
    if (!isConfigured) return;

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const tables = [
      'users',
      'care_circles',
      'circle_members',
      'invite_codes',
      'appointments',
      'medications',
      'medication_logs',
      'health_checkins',
      'audit_log',
      'notification_log',
      'passcode_rate_limits',
    ];

    for (const table of tables) {
      const { error } = await admin.from(table).select('id').limit(1);
      expect(error, `Expected table "${table}" to exist and be accessible`).toBeNull();
    }
  });

  it('verifies appointments CRUD and Care Circle structure on live database', async () => {
    if (!isConfigured) return;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Create a transient test user via Supabase Auth Admin
    const testEmail = `verify_${Date.now()}@testcareconnect.com`;
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password: 'Password123!Secure',
      email_confirm: true,
      user_metadata: { role: 'elderly_user', full_name: 'Test Elder Live Verify' },
    });

    expect(authErr).toBeNull();
    expect(authUser?.user).toBeDefined();
    if (!authUser?.user) return;
    const testUserId = authUser.user.id;

    // 2. Insert into public.users
    await admin.from('users').upsert({
      id: testUserId,
      email: testEmail,
      role: 'elderly_user',
      full_name: 'Test Elder Live Verify',
    });

    // 3. Insert test Care Circle
    const { data: circle, error: circleErr } = await admin
      .from('care_circles')
      .insert({
        elder_id: testUserId,
        name: 'Live Test Circle',
      })
      .select()
      .single();

    expect(circleErr).toBeNull();
    expect(circle).toBeDefined();
    if (!circle) return;
    expect(circle.name).toBe('Live Test Circle');

    // 4. Insert test appointment
    const { data: appt, error: apptErr } = await admin
      .from('appointments')
      .insert({
        circle_id: circle.id,
        doctor_name: 'Dr. Jane Hopkins',
        specialty: 'Geriatrics',
        location: 'Wellness Medical Clinic',
        datetime: new Date(Date.now() + 86400000).toISOString(),
        created_by: testUserId,
        status: 'upcoming',
      })
      .select()
      .single();

    expect(apptErr).toBeNull();
    expect(appt).toBeDefined();
    if (!appt) return;
    expect(appt.doctor_name).toBe('Dr. Jane Hopkins');

    // 5. Clean up test records
    await admin.from('appointments').delete().eq('id', appt.id);
    await admin.from('care_circles').delete().eq('id', circle.id);
    await admin.from('users').delete().eq('id', testUserId);
    await admin.auth.admin.deleteUser(testUserId);
  });
});
