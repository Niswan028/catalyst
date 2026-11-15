// Circle passcode invite generator tab component
import React from 'react';
import Button from '@/components/Button';

interface CircleInviteTabProps {
  inviteRole: 'editor' | 'viewer';
  setInviteRole: (role: 'editor' | 'viewer') => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  maxUses: number;
  setMaxUses: (uses: number) => void;
  generatedPasscode: string | null;
  copied: boolean;
  onGeneratePasscode: () => void;
  onCopyPasscode: () => void;
}

export default function CircleInviteTab({
  inviteRole,
  setInviteRole,
  expiryHours,
  setExpiryHours,
  maxUses,
  setMaxUses,
  generatedPasscode,
  copied,
  onGeneratePasscode,
  onCopyPasscode,
}: CircleInviteTabProps) {
  return (
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

      <Button onClick={onGeneratePasscode} variant="primary" className="w-full py-3">
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
          <Button onClick={onCopyPasscode} variant="secondary" size="sm">
            {copied ? '✓ Copied to Clipboard!' : 'Copy Passcode'}
          </Button>
          <p className="text-[11px] text-gray-500 mt-3">
            Note: For security, the raw passcode is never stored on our servers. Store or share it now.
          </p>
        </div>
      )}
    </div>
  );
}
