// Active invite passcodes list tab component
import React from 'react';
import { InviteCode } from '@/lib/types';

interface CircleActivePasscodesTabProps {
  activeInvites: InviteCode[];
  onRevokeInvite: (id: string) => void;
}

export default function CircleActivePasscodesTab({
  activeInvites,
  onRevokeInvite,
}: CircleActivePasscodesTabProps) {
  if (activeInvites.length === 0) {
    return <p className="text-gray-500 text-center py-6">No active invite passcodes generated yet.</p>;
  }

  return (
    <div className="space-y-4">
      {activeInvites.map((invite) => {
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
                onClick={() => onRevokeInvite(invite.id)}
                className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Revoke
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
