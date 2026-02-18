import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllEvents } from '../hooks/useQueries';
import { enrichEvent, getPrimaryDate } from '../utils/eventAdapter';
import { getEventsForDate, hasOverduePayment } from '../utils/eventMetrics';
import { getCalendarDays, getMonthYear, nextMonth, prevMonth, isSameDayAs, isTodayDate, isSameMonthAs } from '../utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../components/empty/EmptyState';
import { isPast, isFuture, isSameDay } from 'date-fns';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: events = [], isLoading } = useGetAllEvents();
  
  const enrichedEvents = events.map(enrichEvent);
  const calendarDays = getCalendarDays(currentMonth);
  const selectedDateEvents = selectedDate ? getEventsForDate(enrichedEvents, selectedDate) : [];

  const getEventIndicator = (date: Date) => {
    const dayEvents = getEventsForDate(enrichedEvents, date);
    if (dayEvents.length === 0) return null;

    const hasOverdue = dayEvents.some(hasOverduePayment);
    const eventDate = date;
    const isUpcoming = isFuture(eventDate);
    const isToday = isTodayDate(eventDate);

    if (hasOverdue) return 'bg-destructive';
    if (isToday) return 'bg-chart-2';
    if (isUpcoming) return 'bg-chart-4';
    return 'bg-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(prevMonth(currentMonth))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle>{getMonthYear(currentMonth)}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(nextMonth(currentMonth))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isSelected = selectedDate && isSameDayAs(day, selectedDate);
              const isToday = isTodayDate(day);
              const isCurrentMonth = isSameMonthAs(day, currentMonth);
              const indicator = getEventIndicator(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded-lg text-sm font-medium transition-colors relative
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                    ${isToday && !isSelected ? 'border-2 border-primary' : ''}
                    ${!isCurrentMonth ? 'text-muted-foreground opacity-50' : ''}
                  `}
                >
                  {day.getDate()}
                  {indicator && (
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${indicator}`} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <EmptyState
                title="No Events"
                description="No events scheduled for this date."
                action={{
                  label: 'Add Event',
                  onClick: () => navigate({ to: '/add-event' }),
                }}
              />
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(event => {
                  const isOverdue = hasOverduePayment(event);
                  
                  return (
                    <div
                      key={event.id.toString()}
                      onClick={() => navigate({ to: '/event/$eventId', params: { eventId: event.id.toString() } })}
                      className="p-4 bg-accent/50 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{event.formData.eventName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.formData.startTime} - {event.formData.endTime}
                          </p>
                          <p className="text-sm text-muted-foreground">{event.formData.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {event.formData.sports.slice(0, 2).map(sport => (
                              <Badge key={sport} variant={isOverdue ? 'destructive' : 'secondary'}>
                                {sport}
                              </Badge>
                            ))}
                            {event.formData.sports.length > 2 && (
                              <Badge variant="outline">+{event.formData.sports.length - 2}</Badge>
                            )}
                          </div>
                          {event.pendingAmount > 0 && (
                            <span className={`text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              ₹{event.pendingAmount} {isOverdue ? 'overdue' : 'pending'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
