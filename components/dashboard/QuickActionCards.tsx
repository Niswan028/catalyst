// Quick Actions navigation cards for Dashboard
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';

export default function QuickActionCards() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="hover:shadow-soft transition-all cursor-pointer" hover onClick={() => router.push('/checkin')}>
        <div className="text-center py-2">
          <div className="text-4xl mb-2">🎤</div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Voice Health Check-In</h3>
          <p className="text-slate-500 text-xs mb-3">Speak naturally to record your symptoms and mood</p>
          <Button size="sm" fullWidth onClick={() => router.push('/checkin')}>
            Start Check-In
          </Button>
        </div>
      </Card>

      <Card className="hover:shadow-soft transition-all cursor-pointer" hover onClick={() => router.push('/appointments')}>
        <div className="text-center py-2">
          <div className="text-4xl mb-2">🗓️</div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Doctor Appointments</h3>
          <p className="text-slate-500 text-xs mb-3">View clinic visits, locations and download .ics</p>
          <Button size="sm" variant="secondary" fullWidth onClick={() => router.push('/appointments')}>
            View Appointments
          </Button>
        </div>
      </Card>

      <Card className="hover:shadow-soft transition-all cursor-pointer" hover onClick={() => router.push('/messages')}>
        <div className="text-center py-2">
          <div className="text-4xl mb-2">💬</div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Care Circle Messages</h3>
          <p className="text-slate-500 text-xs mb-3">Send audio notes and stay connected with family</p>
          <Button size="sm" variant="secondary" fullWidth onClick={() => router.push('/messages')}>
            Open Messages
          </Button>
        </div>
      </Card>
    </div>
  );
}
