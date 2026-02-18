import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { parseBookingText } from '../../utils/bookingParser';
import type { EventFormData } from '../../utils/eventAdapter';

interface VoiceInputButtonProps {
  onParsed: (data: Partial<EventFormData>) => void;
}

export default function VoiceInputButton({ onParsed }: VoiceInputButtonProps) {
  const { isSupported, isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const [lastTranscript, setLastTranscript] = useState('');

  if (!isSupported) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript && transcript !== lastTranscript) {
        const parsed = parseBookingText(transcript);
        onParsed(parsed);
        setLastTranscript(transcript);
      }
    } else {
      startListening();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isListening ? 'destructive' : 'secondary'}
          onClick={handleToggle}
          className="gap-2"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Stop Listening' : 'Voice Input'}
        </Button>
        {isListening && (
          <Badge variant="destructive" className="animate-pulse">
            Listening...
          </Badge>
        )}
      </div>
      {transcript && (
        <div className="p-3 bg-accent rounded-lg">
          <p className="text-sm font-medium mb-1">Recognized:</p>
          <p className="text-sm text-muted-foreground">{transcript}</p>
        </div>
      )}
    </div>
  );
}
