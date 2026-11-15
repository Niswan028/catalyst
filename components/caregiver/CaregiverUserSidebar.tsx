'use client';

import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatDate } from '@/lib/date';
import { LinkedElderUser } from '@/hooks/useCaregiverData';

interface CaregiverUserSidebarProps {
  linkedUsers: LinkedElderUser[];
  selectedUser: LinkedElderUser | null;
  onSelectUser: (user: LinkedElderUser) => void;
  onOpenLinkForm: () => void;
}

export function CaregiverUserSidebar({
  linkedUsers,
  selectedUser,
  onSelectUser,
  onOpenLinkForm,
}: CaregiverUserSidebarProps) {
  return (
    <Card title="Linked Users">
      {linkedUsers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4" role="img" aria-label="People">
            👥
          </div>
          <p className="text-gray-600 mb-4">No linked users yet</p>
          <Button onClick={onOpenLinkForm} size="sm">
            Link Your First User
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {linkedUsers.map((link) => (
            <button
              type="button"
              key={link.id}
              className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors ${
                selectedUser?.id === link.id
                  ? 'bg-primary-100 border-2 border-primary-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => onSelectUser(link)}
            >
              <p className="font-medium text-gray-800">
                {link.elderly_user.full_name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">{link.elderly_user.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Linked {formatDate(link.created_at)}
              </p>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
