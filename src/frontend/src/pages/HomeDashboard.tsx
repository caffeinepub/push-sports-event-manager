import { useNavigate } from '@tanstack/react-router';
import { useGetAllEvents } from '../hooks/useQueries';
import { enrichEvent } from '../utils/eventAdapter';
import { getTotalEventsThisMonth, getUpcomingEvents, getTotalRevenueThisMonth, getTotalPendingPayments } from '../utils/eventMetrics';
import { formatDate, formatTime } from '../utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, TrendingUp, DollarSign, Clock } from 'lucide-react';
import EmptyState from '../components/empty/EmptyState';

export default function HomeDashboard() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useGetAllEvents();
  
  const enrichedEvents = events.map(enrichEvent);
  const totalEventsThisMonth = getTotalEventsThisMonth(enrichedEvents);
  const upcomingEvents = getUpcomingEvents(enrichedEvents, 7);
  const totalRevenue = getTotalRevenueThisMonth(enrichedEvents);
  const totalPending = getTotalPendingPayments(enrichedEvents);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEventsThisMonth}</p>
                <p className="text-xs text-muted-foreground">Events This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <Clock className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-xs text-muted-foreground">Next 7 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-4/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalRevenue}</p>
                <p className="text-xs text-muted-foreground">Revenue This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalPending}</p>
                <p className="text-xs text-muted-foreground">Pending Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate({ to: '/add-event' })} className="flex-1 gap-2">
          <Plus className="h-4 w-4" />
          Add New Event
        </Button>
        <Button onClick={() => navigate({ to: '/calendar' })} variant="outline" className="flex-1 gap-2">
          <Calendar className="h-4 w-4" />
          Calendar View
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <EmptyState
              title="No Upcoming Events"
              description="You don't have any events scheduled for the next 7 days."
              action={{
                label: 'Add Event',
                onClick: () => navigate({ to: '/add-event' }),
              }}
            />
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id.toString()}
                  onClick={() => navigate({ to: '/event/$eventId', params: { eventId: event.id.toString() } })}
                  className="p-4 bg-accent/50 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{event.formData.eventName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.formData.eventDate)} at {event.formData.startTime}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.formData.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={event.pendingAmount > 0 ? 'destructive' : 'secondary'}>
                        {event.formData.eventType}
                      </Badge>
                      {event.pendingAmount > 0 && (
                        <span className="text-xs text-destructive font-medium">₹{event.pendingAmount} pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="text-center text-sm text-muted-foreground py-4">
        <p>© {new Date().getFullYear()} Built with ❤️ using{' '}
          <a 
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
