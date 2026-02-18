import type { EnrichedEvent } from './eventAdapter';
import { startOfMonth, endOfMonth, addDays, isWithinInterval, isSameDay, isPast } from 'date-fns';

export function getTotalEventsThisMonth(events: EnrichedEvent[]): number {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  
  return events.filter(event => {
    const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
    return isWithinInterval(eventDate, { start, end });
  }).length;
}

export function getUpcomingEvents(events: EnrichedEvent[], days: number = 7): EnrichedEvent[] {
  const now = new Date();
  const end = addDays(now, days);
  
  return events
    .filter(event => {
      const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
      return isWithinInterval(eventDate, { start: now, end }) && 
             event.formData.status !== 'Cancelled';
    })
    .sort((a, b) => Number(a.dateTimestamp - b.dateTimestamp));
}

export function getTotalRevenueThisMonth(events: EnrichedEvent[]): number {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  
  return events
    .filter(event => {
      const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
      return isWithinInterval(eventDate, { start, end }) && 
             event.formData.status === 'Completed';
    })
    .reduce((sum, event) => sum + event.formData.advancePaid, 0);
}

export function getTotalPendingPayments(events: EnrichedEvent[]): number {
  return events
    .filter(event => event.formData.status !== 'Cancelled')
    .reduce((sum, event) => sum + event.pendingAmount, 0);
}

export function getEventsForDate(events: EnrichedEvent[], date: Date): EnrichedEvent[] {
  return events
    .filter(event => {
      const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
      return isSameDay(eventDate, date);
    })
    .sort((a, b) => Number(a.dateTimestamp - b.dateTimestamp));
}

export function hasOverduePayment(event: EnrichedEvent): boolean {
  const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
  return event.pendingAmount > 0 && isPast(eventDate) && event.formData.status !== 'Cancelled';
}

export function getPendingPaymentEvents(events: EnrichedEvent[]): EnrichedEvent[] {
  return events.filter(event => 
    event.pendingAmount > 0 && event.formData.status !== 'Cancelled'
  );
}

export function filterEventsByMonth(events: EnrichedEvent[], month: Date): EnrichedEvent[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  
  return events.filter(event => {
    const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
    return isWithinInterval(eventDate, { start, end });
  });
}
