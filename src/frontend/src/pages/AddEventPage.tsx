import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAddEvent } from '../hooks/useQueries';
import { formDataToBackendInput, type EventFormData } from '../utils/eventAdapter';
import EventForm from '../components/events/EventForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const DRAFT_KEY = 'event-draft';

export default function AddEventPage() {
  const navigate = useNavigate();
  const addEvent = useAddEvent();
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const initialFormData: EventFormData = {
    eventName: '',
    eventDateFrom: new Date(),
    eventDateTo: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    organizerName: '',
    organizerPhone: '',
    organizerEmail: '',
    totalAmount: 0,
    advancePaid: 0,
    sports: [],
    requirements: {
      cafeteria: false,
      actionCamera: false,
      canopy: false,
      chairs: false,
      micSystem: false,
      scoreboard: false,
    },
    specialNotes: '',
    status: 'Upcoming',
  };

  const [formData, setFormData] = useState<EventFormData>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShowDraftBanner(true);
        return {
          ...parsed,
          eventDateFrom: new Date(parsed.eventDateFrom || parsed.eventDate),
          eventDateTo: new Date(parsed.eventDateTo || parsed.eventDate),
          sports: parsed.sports || (parsed.eventType ? [parsed.eventType] : []),
        };
      } catch {
        return initialFormData;
      }
    }
    return initialFormData;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.eventName || formData.location || formData.organizerName) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleSubmit = async (data: EventFormData) => {
    const input = formDataToBackendInput(data);
    const eventId = await addEvent.mutateAsync(input);
    localStorage.removeItem(DRAFT_KEY);
    navigate({ to: '/event/$eventId', params: { eventId: eventId.toString() } });
  };

  const handleDiscard = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(initialFormData);
    setShowDraftBanner(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add New Event</h1>
      </div>

      {showDraftBanner && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Draft restored from previous session</span>
            <button
              onClick={handleDiscard}
              className="text-sm underline hover:no-underline"
            >
              Discard
            </button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            initialData={formData}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: '/' })}
            isSubmitting={addEvent.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
