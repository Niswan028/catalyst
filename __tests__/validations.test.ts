import { describe, it, expect } from 'vitest';
import {
  createMedicationSchema,
  updateMedicationSchema,
  logMedicationSchema,
} from '@/lib/validations/medications';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from '@/lib/validations/appointments';
import {
  createCircleSchema,
  createInviteSchema,
  joinCircleSchema,
  updateMemberSchema,
} from '@/lib/validations/circles';

describe('Input Validations with Zod', () => {
  describe('Medication Schemas', () => {
    it('accepts valid medication creation input', () => {
      const valid = {
        name: 'Metformin',
        dosage: '500mg',
        time: '08:30',
        total_stock: 60,
        low_stock_threshold: 10,
      };
      const result = createMedicationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid time formats', () => {
      const invalidTimes = ['8:30', '25:00', '12:60', 'morning', '08:30:00'];
      for (const time of invalidTimes) {
        const result = createMedicationSchema.safeParse({
          name: 'Aspirin',
          dosage: '100mg',
          time,
          total_stock: 30,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects negative stock counts', () => {
      const result = createMedicationSchema.safeParse({
        name: 'Lisinopril',
        dosage: '10mg',
        time: '09:00',
        total_stock: -5,
      });
      expect(result.success).toBe(false);
    });

    it('validates medication log status', () => {
      const validLog = {
        medication_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'taken',
        scheduled_time: new Date().toISOString(),
      };
      expect(logMedicationSchema.safeParse(validLog).success).toBe(true);

      const invalidLog = {
        medication_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'forgotten', // Invalid enum
        scheduled_time: new Date().toISOString(),
      };
      expect(logMedicationSchema.safeParse(invalidLog).success).toBe(false);
    });
  });

  describe('Appointment Schemas', () => {
    it('accepts valid appointment creation input', () => {
      const valid = {
        doctor_name: 'Dr. Sarah Smith',
        specialty: 'Cardiology',
        location: 'City General Hospital, Room 402',
        datetime: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Bring previous blood work results',
        status: 'upcoming',
      };
      const result = createAppointmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects doctor names shorter than 2 characters', () => {
      const result = createAppointmentSchema.safeParse({
        doctor_name: 'D',
        datetime: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid appointment datetime strings', () => {
      const result = createAppointmentSchema.safeParse({
        doctor_name: 'Dr. John Doe',
        datetime: 'not-a-valid-date',
      });
      expect(result.success).toBe(false);
    });

    it('validates partial updates for appointments', () => {
      const validUpdate = {
        status: 'done',
        notes: 'Follow-up in 3 months',
      };
      const result = updateAppointmentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('Care Circle and Passcode Schemas', () => {
    it('validates care circle creation', () => {
      expect(createCircleSchema.safeParse({ name: 'Vance Family Circle' }).success).toBe(true);
      expect(createCircleSchema.safeParse({ name: 'A' }).success).toBe(false);
    });

    it('validates invite passcode generation rules (24h to 7d)', () => {
      expect(createInviteSchema.safeParse({ role: 'editor', expiry_hours: 48, max_uses: 1 }).success).toBe(true);
      expect(createInviteSchema.safeParse({ role: 'viewer', expiry_hours: 12 }).success).toBe(false); // below 24h min
      expect(createInviteSchema.safeParse({ role: 'viewer', expiry_hours: 200 }).success).toBe(false); // above 168h max
    });

    it('validates passcode format when joining circle', () => {
      expect(joinCircleSchema.safeParse({ passcode: 'ABC234' }).success).toBe(true);
      expect(joinCircleSchema.safeParse({ passcode: 'ABC' }).success).toBe(false); // < 6 chars
      expect(joinCircleSchema.safeParse({ passcode: 'TOOLONG123' }).success).toBe(false); // > 8 chars
      expect(joinCircleSchema.safeParse({ passcode: 'AB-23!' }).success).toBe(false); // special chars
    });

    it('validates member role and permissions updates', () => {
      const validUpdate = {
        member_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'editor',
        status: 'approved',
        permissions: {
          medications: true,
          appointments: true,
          health_checkins: false,
        },
      };
      expect(updateMemberSchema.safeParse(validUpdate).success).toBe(true);
    });
  });
});
