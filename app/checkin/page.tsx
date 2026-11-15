// Daily health check-in page with voice and full text alternative
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CheckInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [step, setStep] = useState<'ready' | 'listening' | 'processing' | 'complete'>('ready');
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [error, setError] = useState('');
  const { speak, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const {
    isListening,
    transcript: liveTranscript,
    isSupported: asrSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (finalTranscript) => {
      setTranscript((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
    },
    onError: (error) => {
      setError(`Speech recognition note: ${error}. You can also type your check-in below.`);
      setStep('ready');
    },
  });

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
      }
    };
    checkAuth();
  }, [router]);

  const handleStartCheckIn = () => {
    setTranscript('');
    setError('');
    setStep('listening');

    // Speak the greeting
    if (ttsSupported) {
      speak('Hello, how are you feeling today?');
    }

    // Start listening after speech finishes
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
        console.error('Summary generation non-critical error:', sumErr);
      }

      if (ttsSupported) {
        speak('Thank you! Your check-in has been recorded.');
      }
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to submit check-in');
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
            <Button onClick={() => setStep('ready')} variant="secondary">
              Record Another
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto space-y-6">
      <Card>
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Daily Health Check-In</h1>
          <p className="text-gray-600">
            Share how you are feeling today by voice or text.
          </p>
        </header>

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

        {/* VOICE MODE */}
        {mode === 'voice' && (
          <section aria-labelledby="voice-checkin-heading">
            <h2 id="voice-checkin-heading" className="sr-only">Voice Check-In</h2>

            {step === 'ready' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4" role="img" aria-label="Microphone">
                  🎤
                </div>
                <p className="text-gray-700 mb-6 text-lg">
                  Tap the button to start. The app will greet you and record your response.
                </p>
                <Button onClick={handleStartCheckIn} size="lg" className="px-8 py-3 text-lg">
                  Start Voice Check-In
                </Button>
              </div>
            )}

            {step === 'listening' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-pulse text-red-600" role="img" aria-label="Recording">
                  🔴
                </div>
                {isSpeaking ? (
                  <p className="text-xl text-primary-700 font-bold mb-4">
                    🔊 &quot;Hello, how are you feeling today?&quot;
                  </p>
                ) : (
                  <>
                    <p className="text-xl text-red-700 font-bold mb-2">
                      Listening... Speak now!
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Mention your mood, symptoms, aches, appetite, or how you slept.
                    </p>
                  </>
                )}

                {(transcript || liveTranscript) && (
                  <div
                    className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6 text-left"
                    aria-live="polite"
                  >
                    <p className="text-xs uppercase font-bold text-gray-500 mb-1">
                      Captured Transcript:
                    </p>
                    <p className="text-gray-900 font-medium text-base">
                      {transcript + ' ' + liveTranscript}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleStopListening}
                  variant="danger"
                  size="lg"
                  className="px-8 py-3 text-lg font-bold"
                >
                  ⏹️ Stop & Submit Check-In
                </Button>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" />
                <p className="text-gray-700 mt-4 text-lg font-semibold">
                  Analyzing health keywords and saving your summary...
                </p>
              </div>
            )}
          </section>
        )}

        {/* TEXT ALTERNATIVE MODE (WCAG 2.1 AA) */}
        {mode === 'text' && (
          <section aria-labelledby="text-checkin-heading">
            <h2 id="text-checkin-heading" className="text-xl font-bold text-gray-800 mb-2">
              Write Your Daily Health Note
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Type how you are feeling today. Mention your sleep, energy, aches, or general mood.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
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
                  disabled={step === 'processing' || !manualText.trim()}
                  className="px-8"
                >
                  {step === 'processing' ? 'Submitting...' : 'Submit Health Check-In'}
                </Button>
              </div>
            </form>
          </section>
        )}
      </Card>
    </main>
  );
}
