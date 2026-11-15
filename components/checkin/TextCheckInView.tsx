// Text alternative check-in component for WCAG 2.1 AA accessibility
import React from 'react';
import Button from '@/components/Button';

interface TextCheckInViewProps {
  manualText: string;
  setManualText: (text: string) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TextCheckInView({
  manualText,
  setManualText,
  isProcessing,
  onSubmit,
}: TextCheckInViewProps) {
  return (
    <section aria-labelledby="text-checkin-heading">
      <h2 id="text-checkin-heading" className="text-xl font-bold text-gray-800 mb-2">
        Write Your Daily Health Note
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Type how you are feeling today. Mention your sleep, energy, aches, or general mood.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="manual-health-text" className="sr-only">
            Daily Health Check-In Text
          </label>
          <textarea
            id="manual-health-text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={5}
            placeholder="e.g. I slept well last night and had a healthy breakfast. Feeling good today with no knee pain."
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none text-base text-gray-900"
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isProcessing || !manualText.trim()}
            className="px-8"
          >
            {isProcessing ? 'Submitting...' : 'Submit Health Check-In'}
          </Button>
        </div>
      </form>
    </section>
  );
}
