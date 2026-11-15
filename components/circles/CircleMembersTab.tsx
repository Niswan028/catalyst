// Circle members list tab component
import React from 'react';
import Button from '@/components/Button';
import { CircleMember } from '@/lib/types';

interface CircleMembersTabProps {
  members: CircleMember[];
  onUpdateMember: (
    memberId: string,
    updates: {
      status?: 'pending' | 'approved' | 'revoked';
      role?: 'editor' | 'viewer';
      permissions?: Partial<CircleMember['permissions']>;
    }
  ) => void;
  onRevokeMember: (memberId: string) => void;
}

export default function CircleMembersTab({
  members,
  onUpdateMember,
  onRevokeMember,
}: CircleMembersTabProps) {
  if (members.length === 0) {
    return <p className="text-gray-500 text-center py-6">No members in your circle yet.</p>;
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
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
                  onClick={() => onUpdateMember(member.id, { status: 'approved' })}
                >
                  Approve
                </Button>
              )}

              {member.status === 'approved' && (
                <select
                  value={member.role}
                  onChange={(e) =>
                    onUpdateMember(member.id, {
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
                  onClick={() => onRevokeMember(member.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Revoke
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
