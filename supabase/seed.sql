-- =========================================================================
-- CareConnect Complete Hackathon Demo Seed Script (Eleanor Vance Family Circle)
-- =========================================================================

-- Note: Ensure users exist in auth.users or public.users.
-- This script seeds Eleanor Vance, her family circle, medications, 7-day adherence history, and appointments.

DO $$
DECLARE
  v_elder_id UUID;
  v_caregiver_id UUID;
  v_circle_id UUID;
  v_med1_id UUID;
  v_med2_id UUID;
  v_med3_id UUID;
  v_med4_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Identify or retrieve Eleanor Vance user ID
  SELECT id INTO v_elder_id FROM public.users WHERE email = 'eleanor.vance.demo@gmail.com' LIMIT 1;
  IF v_elder_id IS NULL THEN
    -- Fallback to first elderly user or create mock
    SELECT id INTO v_elder_id FROM public.users WHERE role = 'elderly_user' LIMIT 1;
  END IF;

  SELECT id INTO v_caregiver_id FROM public.users WHERE email = 'marcus.caregiver.demo@gmail.com' LIMIT 1;
  IF v_caregiver_id IS NULL THEN
    SELECT id INTO v_caregiver_id FROM public.users WHERE role = 'caregiver' LIMIT 1;
  END IF;

  IF v_elder_id IS NOT NULL THEN
    -- 2. Upsert Vance Family Care Circle
    INSERT INTO public.care_circles (elder_id, name)
    VALUES (v_elder_id, 'Vance Family Care Circle')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_circle_id FROM public.care_circles WHERE elder_id = v_elder_id LIMIT 1;

    -- Add Elder as Owner
    INSERT INTO public.circle_members (circle_id, user_id, role, status, permissions, notification_preferences)
    VALUES (
      v_circle_id,
      v_elder_id,
      'owner',
      'approved',
      '{"medications": true, "appointments": true, "health_checkins": true, "voice_messages": true, "insights": true}'::jsonb,
      '{"upcoming_doses": true, "missed_doses": true, "appointments": true, "weekly_digest": true}'::jsonb
    )
    ON CONFLICT (circle_id, user_id) DO UPDATE SET status = 'approved', role = 'owner';

    -- Add Marcus if present
    IF v_caregiver_id IS NOT NULL THEN
      INSERT INTO public.circle_members (circle_id, user_id, role, status, permissions, notification_preferences)
      VALUES (
        v_circle_id,
        v_caregiver_id,
        'editor',
        'approved',
        '{"medications": true, "appointments": true, "health_checkins": true, "voice_messages": true, "insights": true}'::jsonb,
        '{"upcoming_doses": true, "missed_doses": true, "appointments": true, "weekly_digest": true}'::jsonb
      )
      ON CONFLICT (circle_id, user_id) DO UPDATE SET status = 'approved', role = 'editor';
    END IF;

    -- 3. Seed 4 Realistic Medications
    -- Lisinopril
    INSERT INTO public.medications (user_id, name, dosage, frequency, time, instructions, total_stock, refill_threshold, is_active)
    VALUES (v_elder_id, 'Lisinopril', '10mg', 'Once daily', '08:00', 'Take in the morning with a full glass of water', 28, 7, true)
    RETURNING id INTO v_med1_id;

    -- Metformin
    INSERT INTO public.medications (user_id, name, dosage, frequency, time, instructions, total_stock, refill_threshold, is_active)
    VALUES (v_elder_id, 'Metformin', '500mg', 'Twice daily', '12:30', 'Take with meals to minimize stomach upset', 45, 10, true)
    RETURNING id INTO v_med2_id;

    -- Atorvastatin (Low stock alert demonstration)
    INSERT INTO public.medications (user_id, name, dosage, frequency, time, instructions, total_stock, refill_threshold, is_active)
    VALUES (v_elder_id, 'Atorvastatin', '20mg', 'Once daily', '21:00', 'Take in evening before bedtime', 5, 7, true)
    RETURNING id INTO v_med3_id;

    -- Vitamin D3
    INSERT INTO public.medications (user_id, name, dosage, frequency, time, instructions, total_stock, refill_threshold, is_active)
    VALUES (v_elder_id, 'Vitamin D3', '1000 IU', 'Once daily', '09:00', 'Take with breakfast', 60, 10, true)
    RETURNING id INTO v_med4_id;

    -- 4. Seed Stock Alert for Atorvastatin
    IF v_med3_id IS NOT NULL THEN
      INSERT INTO public.stock_alerts (user_id, medication_id, message, is_resolved)
      VALUES (
        v_elder_id,
        v_med3_id,
        'Atorvastatin stock is critically low (5 doses remaining, threshold is 7 doses). Please request a refill from the pharmacy.',
        false
      );
    END IF;

    -- 5. Seed 7-Day Adherence History (Logs)
    -- Past 6 days taken, 1 skipped
    FOR i IN 1..7 LOOP
      IF v_med1_id IS NOT NULL THEN
        INSERT INTO public.medication_logs (medication_id, status, scheduled_time, created_at)
        VALUES (
          v_med1_id,
          'taken',
          (v_today - i) + TIME '08:00',
          (v_today - i) + TIME '08:05'
        );
      END IF;

      IF v_med2_id IS NOT NULL THEN
        INSERT INTO public.medication_logs (medication_id, status, scheduled_time, created_at)
        VALUES (
          v_med2_id,
          CASE WHEN i = 2 THEN 'skipped' ELSE 'taken' END,
          (v_today - i) + TIME '12:30',
          (v_today - i) + TIME '12:32'
        );
      END IF;

      IF v_med3_id IS NOT NULL THEN
        INSERT INTO public.medication_logs (medication_id, status, scheduled_time, created_at)
        VALUES (
          v_med3_id,
          'taken',
          (v_today - i) + TIME '21:00',
          (v_today - i) + TIME '21:10'
        );
      END IF;
    END LOOP;

    -- 6. Seed Upcoming Doctor Appointments
    IF v_circle_id IS NOT NULL THEN
      INSERT INTO public.appointments (circle_id, doctor_name, specialty, location, datetime, notes, status)
      VALUES 
        (
          v_circle_id,
          'Dr. Sarah Jenkins',
          'Cardiology',
          'City General Hospital, Suite 302',
          NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
          'Routine 6-month blood pressure review and EKG follow-up. Remember to bring daily blood pressure journal.',
          'upcoming'
        ),
        (
          v_circle_id,
          'Dr. Robert Chen',
          'Ophthalmology & Vision Care',
          'Mercy Eye Clinic, Suite 105',
          NOW() + INTERVAL '5 days' + INTERVAL '14 hours',
          'Annual dilated eye exam and diabetic retinopathy screening.',
          'upcoming'
        );

      -- 7. Audit Log Events
      INSERT INTO public.audit_log (circle_id, actor_id, actor_name, action, target_type, target_name, metadata)
      VALUES
        (
          v_circle_id,
          v_elder_id,
          'Eleanor Vance',
          'CREATE_CIRCLE',
          'care_circle',
          'Vance Family Care Circle',
          '{"initial_role": "owner"}'::jsonb
        ),
        (
          v_circle_id,
          v_elder_id,
          'Eleanor Vance',
          'APPROVE_MEMBER',
          'circle_member',
          'Marcus Vance',
          '{"role": "editor"}'::jsonb
        ),
        (
          v_circle_id,
          v_elder_id,
          'Eleanor Vance',
          'ADD_APPOINTMENT',
          'appointment',
          'Dr. Sarah Jenkins (Cardiology)',
          '{"location": "City General Hospital"}'::jsonb
        );
    END IF;

  END IF;
END $$;
