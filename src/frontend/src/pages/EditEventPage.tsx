import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetEvent, useUpdateEvent } from '../hooks/useQueries';
import { eventToFormData, formDataToBackendParams, type EventFormData } from '../utils/eventAdapter';
import EventForm from '../components/events/EventForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditEventPage() {
  const navigate = useNavigate();
  const { eventId } = useParams({ from: '/edit-event/$eventId' });
  const { data: event, isLoading } = useGetEvent(eventId);
  const updateEvent = useUpdateEvent();

  if (isLoading || !event) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">Loading event...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialData = eventToFormData(event);

  const handleSubmit = async (data: EventFormData) => {
    const params = formDataToBackendParams(data);
    await updateEvent.mutateAsync({
      eventId: event.id,
      ...params,
    });
    navigate({ to: '/event/$eventId', params: { eventId: eventId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: '/event/$eventId', params: { eventId: eventId } })}
            isSubmitting={updateEvent.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
