'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';
import { CircleMember, InviteCode, CareCircle } from '@/lib/types';

interface FamilyCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId?: string;
  circleName?: string;
}

export default function FamilyCircleModal({
  isOpen,
  onClose,
  circleId: initialCircleId,
  circleName: initialCircleName,
}: FamilyCircleModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'active_codes'>('members');
  const [circleId, setCircleId] = useState<string | null>(initialCircleId || null);
  const [circleName, setCircleName] = useState<string>(initialCircleName || 'Family Care Circle');
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [activeInvites, setActiveInvites] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite generation state
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [expiryHours, setExpiryHours] = useState<number>(48);
  const [maxUses, setMaxUses] = useState<number>(1);
  const [generatedPasscode, setGeneratedPasscode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCircleAndMembers();
    }
  }, [isOpen, initialCircleId]);

  const loadCircleAndMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      let targetCircleId = circleId || initialCircleId;

      if (!targetCircleId) {
        // Fetch user's circle
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
        // Fetch members
        const membersRes = await fetch(`/api/circles/${targetCircleId}/members`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const membersData = await membersRes.json();
        if (membersRes.ok) {
          setMembers(membersData.members || []);
        }

        // Fetch invites
        const invitesRes = await fetch(`/api/circles/${targetCircleId}/invites`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const invitesData = await invitesRes.json();
        if (invitesRes.ok) {
          setActiveInvites(invitesData.invites || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load family circle members');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePasscode = async () => {
    if (!circleId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedPasscode(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/circles/${circleId}/invites`, {
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
        // Refresh invites list
        loadCircleAndMembers();
      }
    } catch (err) {
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      setError('Failed to update member');
    }
  };

  const handleRevokeMember = async (memberId: string) => {
    if (!circleId) return;
    if (!confirm('Are you sure you want to revoke this member’s access to your health details?')) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      setError('Failed to revoke member access');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!circleId) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      setError('Failed to revoke invite code');
    }
  };

  const copyToClipboard = () => {
    if (!generatedPasscode) return;
    navigator.clipboard.writeText(generatedPasscode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="circle-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold p-2"
          aria-label="Close modal"
        >
          &times;
        </button>

        <header className="mb-6">
          <h2 id="circle-modal-title" className="text-2xl font-bold text-gray-900">
            {circleName}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage who can view or help manage your medications and doctor appointments.
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm" role="status">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'members'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Circle Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'invite'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            + Invite with Passcode
          </button>
          <button
            onClick={() => setActiveTab('active_codes')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'active_codes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Passcodes ({activeInvites.filter((i) => !i.is_revoked).length})
          </button>
        </div>

        {loading && <LoadingSpinner />}

        {/* TAB 1: MEMBERS */}
        {!loading && activeTab === 'members' && (
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No members in your circle yet.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {member.user?.full_name || member.user?.email || 'Circle Member'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          member.role === 'elder'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'editor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {member.role === 'elder' ? 'Elder (Owner)' : member.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          member.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 animate-pulse'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{member.user?.email}</p>
                    {member.permissions && (
                      <div className="flex gap-2 text-[11px] text-gray-500 mt-2">
                        <span>Medications: {member.permissions.medications ? '✓' : '✗'}</span>
                        <span>Appointments: {member.permissions.appointments ? '✓' : '✗'}</span>
                        <span>Check-ins: {member.permissions.health_checkins ? '✓' : '✗'}</span>
                        <span>Voice: {member.permissions.voice_messages ? '✓' : '✗'}</span>
                      </div>
                    )}
                  </div>

                  {member.role !== 'elder' && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {member.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateMember(member.id, { status: 'approved' })}
                        >
                          Approve
                        </Button>
                      )}

                      {member.status === 'approved' && (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateMember(member.id, {
                              role: e.target.value as 'editor' | 'viewer',
                            })
                          }
                          className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-700"
                          aria-label="Change role"
                        >
                          <option value="editor">Editor (Can add/edit)</option>
                          <option value="viewer">Viewer (Read-only)</option>
                        </select>
                      )}

                      {member.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevokeMember(member.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: INVITE CODE GENERATOR */}
        {!loading && activeTab === 'invite' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role Permission</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value="editor">Editor (Can add/edit)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Duration</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Max Uses</label>
                <select
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value={1}>Single Use (1 person)</option>
                  <option value={3}>3 Uses</option>
                  <option value={5}>5 Uses (Family)</option>
                </select>
              </div>
            </div>

            <Button onClick={handleGeneratePasscode} variant="primary" className="w-full py-3">
              Generate Secure Passcode
            </Button>

            {generatedPasscode && (
              <div className="mt-6 p-6 bg-primary-50 border-2 border-primary-300 rounded-2xl text-center">
                <span className="text-xs uppercase tracking-wider font-bold text-primary-700">
                  Your New Invite Passcode
                </span>
                <div className="text-4xl font-extrabold tracking-widest text-primary-900 my-3 font-mono">
                  {generatedPasscode}
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Expires in {expiryHours} hours • Role: {inviteRole.toUpperCase()} • Max uses: {maxUses}
                </p>
                <Button onClick={copyToClipboard} variant="secondary" size="sm">
                  {copied ? '✓ Copied to Clipboard!' : 'Copy Passcode'}
                </Button>
                <p className="text-[11px] text-gray-500 mt-3">
                  Note: For security, the raw passcode is never stored on our servers. Store or share it now.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVE PASSCODES */}
        {!loading && activeTab === 'active_codes' && (
          <div className="space-y-4">
            {activeInvites.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No active invite passcodes generated yet.</p>
            ) : (
              activeInvites.map((invite) => {
                const isExpired = new Date(invite.expires_at).getTime() < Date.now();
                return (
                  <div
                    key={invite.id}
                    className="p-4 border rounded-xl flex items-center justify-between bg-gray-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">
                          {invite.code_prefix}••••
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {invite.role.toUpperCase()}
                        </span>
                        {invite.is_revoked ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            REVOKED
                          </span>
                        ) : isExpired ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Uses: {invite.uses_count} / {invite.max_uses} • Expires:{' '}
                        {new Date(invite.expires_at).toLocaleString()}
                      </p>
                    </div>

                    {!invite.is_revoked && !isExpired && (
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        <footer className="mt-8 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}
