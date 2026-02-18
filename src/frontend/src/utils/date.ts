import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy');
}

export function formatTime(time: string): string {
  return time;
}

export function formatDateTime(date: Date, time: string): string {
  return `${formatDate(date)} at ${time}`;
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getCalendarDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });
  
  const startDay = start.getDay();
  const paddingStart = Array(startDay).fill(null);
  
  const endDay = end.getDay();
  const paddingEnd = Array(6 - endDay).fill(null);
  
  return [...paddingStart, ...days, ...paddingEnd];
}

export function isSameDayAs(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

export function isTodayDate(date: Date): boolean {
  return isToday(date);
}

export function isSameMonthAs(date1: Date, date2: Date): boolean {
  return isSameMonth(date1, date2);
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function prevMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function getMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}
