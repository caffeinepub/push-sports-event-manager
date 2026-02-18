import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllEvents } from '../hooks/useQueries';
import { enrichEvent } from '../utils/eventAdapter';
import { getPendingPaymentEvents, filterEventsByMonth } from '../utils/eventMetrics';
import { formatDate } from '../utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import EmptyState from '../components/empty/EmptyState';
import { startOfMonth, format } from 'date-fns';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useGetAllEvents();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  const enrichedEvents = events.map(enrichEvent);
  const pendingEvents = getPendingPaymentEvents(enrichedEvents);
  const filteredEvents = filterEventsByMonth(pendingEvents, selectedMonth);
  
  const totalPending = filteredEvents.reduce((sum, event) => sum + event.pendingAmount, 0);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return startOfMonth(date);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-3xl font-bold">₹{totalPending}</p>
              <p className="text-sm text-muted-foreground">Total Pending for {format(selectedMonth, 'MMMM yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <label className="text-sm font-medium">Filter by Month</label>
        <Select
          value={selectedMonth.toISOString()}
          onValueChange={(value) => setSelectedMonth(new Date(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(month => (
              <SelectItem key={month.toISOString()} value={month.toISOString()}>
                {format(month, 'MMMM yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <EmptyState
              title="No Pending Payments"
              description={`No events with pending payments in ${format(selectedMonth, 'MMMM yyyy')}.`}
            />
          ) : (
            <div className="space-y-3">
              {filteredEvents.map(event => (
                <div
                  key={event.id.toString()}
                  onClick={() => navigate({ to: '/event/$eventId', params: { eventId: event.id.toString() } })}
                  className="p-4 bg-accent/50 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{event.formData.eventName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.formData.eventDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.formData.organizerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="destructive">
                        ₹{event.pendingAmount}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        of ₹{event.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
