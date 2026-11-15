'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase/client';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JoinCircleModal({ isOpen, onClose, onSuccess }: JoinCircleModalProps) {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lockedUntilSeconds, setLockedUntilSeconds] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmed = passcode.trim().toUpperCase();
    if (trimmed.length < 6 || trimmed.length > 8) {
      setError('Passcode must be between 6 and 8 characters');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be signed in to join a circle');
        return;
      }

      const res = await fetch('/api/circles/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ passcode: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLockedUntilSeconds(data.retryAfterSeconds || 900);
          setError(data.error || 'Too many attempts. You are temporarily locked out.');
        } else {
          setError(data.error || 'Failed to join circle. Please check the passcode.');
        }
      } else {
        setSuccessMessage(data.message || 'Passcode accepted! Your request is pending elder approval.');
        setPasscode('');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      }
    } catch (err) {
      setError('An unexpected network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-circle-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold p-2"
          aria-label="Close modal"
        >
          &times;
        </button>

        <header className="mb-6">
          <h2 id="join-circle-title" className="text-2xl font-bold text-gray-900">
            Join Family Circle
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Enter the 6-8 character invite passcode provided by the elder or family administrator.
          </p>
        </header>

        {error && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            role="alert"
          >
            {error}
            {lockedUntilSeconds && (
              <p className="font-semibold mt-1">
                Lockout time remaining: {Math.ceil(lockedUntilSeconds / 60)} minutes.
              </p>
            )}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm"
            role="status"
          >
            <p className="font-bold text-base mb-1">🎉 Request Submitted!</p>
            <p>{successMessage}</p>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="join-passcode-input" className="block text-sm font-semibold text-gray-700 mb-1">
                Invite Passcode
              </label>
              <input
                id="join-passcode-input"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                placeholder="e.g. 7X8K2M"
                maxLength={8}
                disabled={loading || Boolean(lockedUntilSeconds)}
                className="w-full text-center tracking-widest text-2xl font-mono uppercase px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-600 outline-none"
                autoComplete="off"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Passcodes are single or multi-use and expire within 24 hours to 7 days.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="w-1/2"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-1/2"
                disabled={loading || Boolean(lockedUntilSeconds) || passcode.trim().length < 6}
              >
                {loading ? 'Verifying...' : 'Join Circle'}
              </Button>
            </div>
          </form>
        )}

        {successMessage && (
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
