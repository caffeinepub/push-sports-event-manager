import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetEvent, useDeleteEvent, useUpdateEvent } from '../hooks/useQueries';
import { enrichEvent, formDataToBackendInput } from '../utils/eventAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, CheckCircle, User, Phone, Mail, Clock, DollarSign } from 'lucide-react';
import DeleteEventDialog from '../components/events/DeleteEventDialog';
import { useState } from 'react';
import { isSameDay } from 'date-fns';

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { eventId } = useParams({ from: '/event/$eventId' });
  const { data: event, isLoading } = useGetEvent(eventId);
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const enrichedEvent = enrichEvent(event);
  const { formData, totalAmount, pendingAmount } = enrichedEvent;

  const handleDelete = async () => {
    await deleteEvent.mutateAsync(event.id);
    navigate({ to: '/' });
  };

  const handleMarkCompleted = async () => {
    const updatedFormData = { ...formData, status: 'Completed' as const };
    const input = formDataToBackendInput(updatedFormData);
    await updateEvent.mutateAsync({
      eventId: event.id,
      input,
    });
  };

  const requirements = Object.entries(formData.requirements)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

  const isSingleDay = isSameDay(formData.eventDateFrom, formData.eventDateTo);
  const dateDisplay = isSingleDay
    ? formData.eventDateFrom.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : `${formData.eventDateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${formData.eventDateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Details</h1>
        <Badge variant={formData.status === 'Completed' ? 'secondary' : formData.status === 'Cancelled' ? 'destructive' : 'default'}>
          {formData.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{formData.eventName}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.sports.map(sport => (
                  <Badge key={sport} variant="outline">{sport}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {dateDisplay}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.startTime} - {formData.endTime}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold">Organizer Details</h3>
            {formData.organizerName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{formData.organizerName}</span>
              </div>
            )}
            {formData.organizerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a href={`tel:${formData.organizerPhone}`} className="text-sm hover:underline">
                  {formData.organizerPhone}
                </a>
              </div>
            )}
            {formData.organizerEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href={`mailto:${formData.organizerEmail}`} className="text-sm hover:underline">
                  {formData.organizerEmail}
                </a>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </h3>
            <div className="bg-accent/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Amount</span>
                <span className="font-medium">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Advance Paid</span>
                <span className="font-medium">₹{formData.advancePaid}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Pending Amount</span>
                <span className={`font-bold ${pendingAmount > 0 ? 'text-destructive' : 'text-chart-4'}`}>
                  ₹{pendingAmount}
                </span>
              </div>
            </div>
          </div>

          {requirements.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {requirements.map(req => (
                    <Badge key={req} variant="secondary">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {formData.specialNotes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Special Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {formData.specialNotes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => navigate({ to: '/edit-event/$eventId', params: { eventId: eventId } })}
          className="flex-1 gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        {formData.status !== 'Completed' && (
          <Button
            onClick={handleMarkCompleted}
            variant="outline"
            className="flex-1 gap-2"
            disabled={updateEvent.isPending}
          >
            <CheckCircle className="h-4 w-4" />
            Mark Completed
          </Button>
        )}
      </div>

      <Button
        onClick={() => setShowDeleteDialog(true)}
        variant="destructive"
        className="w-full gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Event
      </Button>

      <DeleteEventDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        eventName={formData.eventName}
        isDeleting={deleteEvent.isPending}
      />
    </div>
  );
}
