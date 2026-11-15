import { describe, it, expect, vi } from 'vitest';
import { checkElderPrivacyPermission } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

describe('Elder Privacy Permissions and Audit Logging', () => {
  describe('checkElderPrivacyPermission', () => {
    it('always allows the elder themselves full access', async () => {
      const mockSupabase = {} as any;
      const result = await checkElderPrivacyPermission(
        mockSupabase,
        'elder-123',
        'elder-123',
        'medications'
      );
      expect(result.allowed).toBe(true);
      expect(result.role).toBe('elder');
    });

    it('allows approved circle members when permission is enabled', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'circle-1',
                  elder_id: 'elder-123',
                  members: [
                    {
                      user_id: 'member-456',
                      role: 'editor',
                      status: 'approved',
                      permissions: { medications: true, health_checkins: false },
                    },
                  ],
                },
              }),
            }),
          }),
        }),
      } as any;

      // Access to medications: allowed
      const medResult = await checkElderPrivacyPermission(
        mockSupabase,
        'member-456',
        'elder-123',
        'medications'
      );
      expect(medResult.allowed).toBe(true);
      expect(medResult.role).toBe('editor');

      // Access to health_checkins: restricted by elder
      const checkinResult = await checkElderPrivacyPermission(
        mockSupabase,
        'member-456',
        'elder-123',
        'health_checkins'
      );
      expect(checkinResult.allowed).toBe(false);
      expect(checkinResult.reason).toContain('restricted');
    });

    it('denies access if user is not in the circle and no legacy link exists', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'care_circles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            };
          }
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          };
        }),
      } as any;

      const result = await checkElderPrivacyPermission(
        mockSupabase,
        'stranger-999',
        'elder-123',
        'appointments'
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not an approved member');
    });
  });

  describe('logAuditEvent', () => {
    it('successfully calls supabase insert with structured payload', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      } as any;

      await logAuditEvent(mockSupabase, {
        circleId: 'circle-1',
        actorId: 'user-1',
        action: 'JOIN_CIRCLE_PASSCODE',
        resourceType: 'circle_members',
        resourceId: 'member-1',
        details: { role: 'editor' },
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          circle_id: 'circle-1',
          actor_id: 'user-1',
          action: 'JOIN_CIRCLE_PASSCODE',
        })
      );
    });
  });
});
