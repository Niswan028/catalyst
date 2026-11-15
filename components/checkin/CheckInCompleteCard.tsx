// Completion celebration screen for health check-in
import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface CheckInCompleteCardProps {
  onRecordAnother: () => void;
}

export default function CheckInCompleteCard({ onRecordAnother }: CheckInCompleteCardProps) {
  const router = useRouter();

  return (
    <main className="max-w-2xl mx-auto py-8">
      <Card className="text-center p-8">
        <div className="text-6xl mb-4" role="img" aria-label="Celebration">
          ✅
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In Recorded!</h1>
        <p className="text-gray-600 mb-6 text-lg">
          Thank you for sharing how you feel. Your daily health summary has been updated for you
          and your care circle.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/dashboard')} variant="primary" size="lg">
            Return to Dashboard
          </Button>
          <Button onClick={onRecordAnother} variant="secondary">
            Record Another
          </Button>
        </div>
      </Card>
    </main>
  );
}
