// Family Care Circle modal dialog - Member management, passcodes & audit trail
'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useFamilyCircle } from '@/hooks/useFamilyCircle';
import CircleMembersTab from '@/components/circles/CircleMembersTab';
import CircleInviteTab from '@/components/circles/CircleInviteTab';
import CircleActivePasscodesTab from '@/components/circles/CircleActivePasscodesTab';
import CircleAuditTab from '@/components/circles/CircleAuditTab';

interface FamilyCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId?: string;
  circleName?: string;
}

type TabType = 'members' | 'invite' | 'active_codes' | 'audit';

export default function FamilyCircleModal({
  isOpen,
  onClose,
  circleId: initialCircleId,
  circleName: initialCircleName,
}: FamilyCircleModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('members');

  const {
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
  } = useFamilyCircle({
    isOpen,
    initialCircleId,
    initialCircleName,
  });

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
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'audit'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🛡️ Audit Trail ({auditLogs.length})
          </button>
        </div>

        {loading && <LoadingSpinner />}

        {/* TAB 1: MEMBERS */}
        {!loading && activeTab === 'members' && (
          <CircleMembersTab
            members={members}
            onUpdateMember={handleUpdateMember}
            onRevokeMember={handleRevokeMember}
          />
        )}

        {/* TAB 2: INVITE CODE GENERATOR */}
        {!loading && activeTab === 'invite' && (
          <CircleInviteTab
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            expiryHours={expiryHours}
            setExpiryHours={setExpiryHours}
            maxUses={maxUses}
            setMaxUses={setMaxUses}
            generatedPasscode={generatedPasscode}
            copied={copied}
            onGeneratePasscode={handleGeneratePasscode}
            onCopyPasscode={copyToClipboard}
          />
        )}

        {/* TAB 3: ACTIVE PASSCODES */}
        {!loading && activeTab === 'active_codes' && (
          <CircleActivePasscodesTab
            activeInvites={activeInvites}
            onRevokeInvite={handleRevokeInvite}
          />
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {!loading && activeTab === 'audit' && (
          <CircleAuditTab auditLogs={auditLogs} />
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
