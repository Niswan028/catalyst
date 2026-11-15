// Daily health check-in page with voice and full text alternative
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import Card from '@/components/Card';
import { logger } from '@/lib/logger';
import CheckInHistoryCard from '@/components/checkin/CheckInHistoryCard';
import VoiceCheckInView from '@/components/checkin/VoiceCheckInView';
import TextCheckInView from '@/components/checkin/TextCheckInView';
import CheckInCompleteCard from '@/components/checkin/CheckInCompleteCard';

export default function CheckInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [step, setStep] = useState<'ready' | 'listening' | 'processing' | 'complete'>('ready');
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [error, setError] = useState('');
  const [pastCheckins, setPastCheckins] = useState<any[]>([]);
  const { speak, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const {
    transcript: liveTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (finalTranscript) => {
      setTranscript((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
    },
    onError: (recError) => {
      setError(`Speech recognition note: ${recError}. You can also type your check-in below.`);
      setStep('ready');
    },
  });

  const fetchPastCheckins = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('health_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setPastCheckins(data);
    } catch (err) {
      logger.error('Failed to load past check-ins', { error: err });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
      } else {
        fetchPastCheckins(user.id);
      }
    };
    checkAuth();
  }, [router]);

  const handleStartCheckIn = () => {
    setTranscript('');
    setError('');
    setStep('listening');

    if (ttsSupported) {
      speak('Hello, how are you feeling today?');
    }

    setTimeout(() => {
      startListening();
    }, 2500);
  };

  const handleStopListening = () => {
    stopListening();
    const fullText = (transcript + ' ' + liveTranscript).trim();
    if (fullText) {
      setStep('processing');
      submitCheckIn(fullText);
    } else {
      setError('No speech detected. You can speak again or switch to typing below.');
      setStep('ready');
    }
  };

  const submitCheckIn = async (textToSubmit: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Session expired. Please sign in again.');
        router.push('/auth/signin');
        return;
      }

      setStep('processing');

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transcript: textToSubmit.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save check-in');
      }

      // Generate daily summary
      try {
        await fetch('/api/summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: session.user.id }),
        });
      } catch (sumErr) {
        logger.error('Summary generation non-critical error', { error: sumErr });
      }

      if (ttsSupported) {
        speak('Thank you! Your check-in has been recorded.');
      }
      setStep('complete');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit check-in';
      setError(msg);
      setStep('ready');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) {
      setError('Please enter how you are feeling today.');
      return;
    }
    submitCheckIn(manualText);
  };

  if (step === 'complete') {
    return <CheckInCompleteCard onRecordAnother={() => setStep('ready')} />;
  }

  return (
    <main className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="text-center border-b border-[#e6dfd3] dark:border-stone-800 pb-5">
        <span className="text-[11px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 block mb-1">
          Holistic Elder Wellness
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
          Daily Health Check-In
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5 max-w-lg mx-auto">
          Share how you are feeling today with spoken voice check-ins or easy text entry.
        </p>
      </div>

      <Card>

        {/* Input Mode Selector for WCAG 2.1 AA Accessibility */}
        <nav aria-label="Input method selector" className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              onClick={() => {
                setMode('voice');
                setError('');
              }}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'voice'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={mode === 'voice'}
            >
              🎤 Voice Input
            </button>
            <button
              onClick={() => {
                setMode('text');
                setError('');
              }}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'text'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-pressed={mode === 'text'}
            >
              ⌨️ Text Alternative
            </button>
          </div>
        </nav>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {mode === 'voice' && (
          <VoiceCheckInView
            step={step}
            isSpeaking={isSpeaking}
            transcript={transcript}
            liveTranscript={liveTranscript}
            onStartCheckIn={handleStartCheckIn}
            onStopListening={handleStopListening}
          />
        )}

        {mode === 'text' && (
          <TextCheckInView
            manualText={manualText}
            setManualText={setManualText}
            isProcessing={step === 'processing'}
            onSubmit={handleManualSubmit}
          />
        )}
      </Card>

      <CheckInHistoryCard pastCheckins={pastCheckins} />
    </main>
  );
}
