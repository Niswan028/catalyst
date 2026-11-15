// Voice check-in presentation component
import React from 'react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VoiceCheckInViewProps {
  step: 'ready' | 'listening' | 'processing' | 'complete';
  isSpeaking: boolean;
  transcript: string;
  liveTranscript: string;
  onStartCheckIn: () => void;
  onStopListening: () => void;
}

export default function VoiceCheckInView({
  step,
  isSpeaking,
  transcript,
  liveTranscript,
  onStartCheckIn,
  onStopListening,
}: VoiceCheckInViewProps) {
  return (
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
          <Button onClick={onStartCheckIn} size="lg" className="px-8 py-3 text-lg">
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
            onClick={onStopListening}
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
  );
}
