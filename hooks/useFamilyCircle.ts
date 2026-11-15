// Custom hook for managing Family Care Circle state, invites, members, and audit logs
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CircleMember, InviteCode } from '@/lib/types';
import { logger } from '@/lib/logger';

export interface UseFamilyCircleProps {
  isOpen: boolean;
  initialCircleId?: string;
  initialCircleName?: string;
}

export interface UseFamilyCircleResult {
  circleId: string | null;
  circleName: string;
  members: CircleMember[];
  activeInvites: InviteCode[];
  auditLogs: any[];
  loading: boolean;
  error: string | null;
  success: string | null;
  inviteRole: 'editor' | 'viewer';
  setInviteRole: (role: 'editor' | 'viewer') => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  maxUses: number;
  setMaxUses: (uses: number) => void;
  generatedPasscode: string | null;
  copied: boolean;
  handleGeneratePasscode: () => Promise<void>;
  handleUpdateMember: (
    memberId: string,
    updates: {
      status?: 'pending' | 'approved' | 'revoked';
      role?: 'editor' | 'viewer';
      permissions?: Partial<CircleMember['permissions']>;
    }
  ) => Promise<void>;
  handleRevokeMember: (memberId: string) => Promise<void>;
  handleRevokeInvite: (inviteId: string) => Promise<void>;
  copyToClipboard: () => void;
  clearMessages: () => void;
}

export function useFamilyCircle({
  isOpen,
  initialCircleId,
  initialCircleName,
}: UseFamilyCircleProps): UseFamilyCircleResult {
  const [circleId, setCircleId] = useState<string | null>(initialCircleId || null);
  const [circleName, setCircleName] = useState<string>(initialCircleName || 'Family Care Circle');
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [activeInvites, setActiveInvites] = useState<InviteCode[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite generation state
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [expiryHours, setExpiryHours] = useState<number>(48);
  const [maxUses, setMaxUses] = useState<number>(1);
  const [generatedPasscode, setGeneratedPasscode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadCircleAndMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let targetCircleId = circleId || initialCircleId;

      // Immediate fallback for Eleanor Vance demo account
      if (!targetCircleId && (session.user.id === '8ce76e37-7e02-4036-9cfb-b5d37520c279' || session.user.email?.toLowerCase().includes('eleanor'))) {
        targetCircleId = '3b2dffda-1b8e-44a5-835a-c58083c75b29';
        setCircleId(targetCircleId);
        setCircleName('Vance Family Care Circle');
      }

      if (!targetCircleId) {
        const res = await fetch('/api/circles', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.circles && data.circles.length > 0) {
          targetCircleId = data.circles[0].id;
          setCircleId(targetCircleId || null);
          setCircleName(data.circles[0].name);
        }
      }

      if (targetCircleId) {
        const [membersRes, invitesRes, auditRes] = await Promise.all([
          fetch(`/api/circles/${targetCircleId}/members`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`/api/circles/${targetCircleId}/invites`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`/api/circles/${targetCircleId}/audit`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);

        const [membersData, invitesData, auditData] = await Promise.all([
          membersRes.json(),
          invitesRes.json(),
          auditRes.json(),
        ]);

        if (membersRes.ok) setMembers(membersData.members || []);
        if (invitesRes.ok) setActiveInvites(invitesData.invites || []);
        if (auditRes.ok) setAuditLogs(auditData.audit_logs || []);
      }
    } catch (err) {
      logger.error('Failed to load family circle members', { error: err });
      setError('Failed to load family circle members');
    } finally {
      setLoading(false);
    }
  }, [circleId, initialCircleId]);

  useEffect(() => {
    if (isOpen) {
      loadCircleAndMembers();
    }
  }, [isOpen, loadCircleAndMembers]);

  const handleGeneratePasscode = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedPasscode(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be signed in to generate an invite passcode.');
        return;
      }

      let activeCircleId = circleId || initialCircleId;

      if (!activeCircleId && (session.user.id === '8ce76e37-7e02-4036-9cfb-b5d37520c279' || session.user.email?.toLowerCase().includes('eleanor'))) {
        activeCircleId = '3b2dffda-1b8e-44a5-835a-c58083c75b29';
        setCircleId(activeCircleId);
      }

      if (!activeCircleId) {
        const res = await fetch('/api/circles', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.circles && data.circles.length > 0) {
          activeCircleId = data.circles[0].id;
          setCircleId(activeCircleId || null);
          setCircleName(data.circles[0].name);
        }
      }

      if (!activeCircleId) {
        setError('Unable to load Care Circle details. Please wait a moment and try again.');
        return;
      }

      const res = await fetch(`/api/circles/${activeCircleId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          role: inviteRole,
          expiry_hours: expiryHours,
          max_uses: maxUses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate invite passcode');
      } else {
        setGeneratedPasscode(data.passcode);
        setSuccess('Passcode generated successfully! Share it securely with your family or caretaker.');
        loadCircleAndMembers();
      }
    } catch (err) {
      logger.error('Error generating passcode', { error: err });
      setError('An unexpected error occurred while generating passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    updates: {
      status?: 'pending' | 'approved' | 'revoked';
      role?: 'editor' | 'viewer';
      permissions?: Partial<CircleMember['permissions']>;
    }
  ) => {
    if (!circleId) return;
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/circles/${circleId}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          member_id: memberId,
          ...updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update member');
      } else {
        setSuccess('Member updated successfully');
        loadCircleAndMembers();
      }
    } catch (err) {
      logger.error('Failed to update member', { error: err });
      setError('Failed to update member');
    }
  };

  const handleRevokeMember = async (memberId: string) => {
    if (!circleId) return;
    if (!confirm('Are you sure you want to revoke this member’s access to your health details?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/circles/${circleId}/members?member_id=${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to revoke member access');
      } else {
        setSuccess('Member access revoked');
        loadCircleAndMembers();
      }
    } catch (err) {
      logger.error('Failed to revoke member access', { error: err });
      setError('Failed to revoke member access');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!circleId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/circles/${circleId}/invites?invite_id=${inviteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        setSuccess('Invite passcode revoked');
        loadCircleAndMembers();
      }
    } catch (err) {
      logger.error('Failed to revoke invite code', { error: err });
      setError('Failed to revoke invite code');
    }
  };

  const copyToClipboard = () => {
    if (!generatedPasscode) return;
    navigator.clipboard.writeText(generatedPasscode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return {
    circleId,
    circleName,
    members,
    activeInvites,
    auditLogs,
    loading,
    error,
    success,
    inviteRole,
    setInviteRole,
    expiryHours,
    setExpiryHours,
    maxUses,
    setMaxUses,
    generatedPasscode,
    copied,
    handleGeneratePasscode,
    handleUpdateMember,
    handleRevokeMember,
    handleRevokeInvite,
    copyToClipboard,
    clearMessages,
  };
}
