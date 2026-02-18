import type { EventFormData } from './eventAdapter';
import { parse, format } from 'date-fns';

export function parseBookingText(text: string): Partial<EventFormData> {
  const result: Partial<EventFormData> = {};
  const lowerText = text.toLowerCase();

  // Parse event type
  if (lowerText.includes('cricket')) result.eventType = 'Cricket';
  else if (lowerText.includes('badminton')) result.eventType = 'Badminton';
  else if (lowerText.includes('football')) result.eventType = 'Football';
  else if (lowerText.includes('volleyball')) result.eventType = 'Volleyball';

  // Parse date (simple patterns)
  const datePatterns = [
    /(?:on|date)\s+(\w+\s+\d{1,2})/i,
    /(\d{1,2})\s+(\w+)/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[1] + (match[2] ? ' ' + match[2] : '');
        const parsed = parse(dateStr, 'MMMM d', new Date());
        if (!isNaN(parsed.getTime())) {
          result.eventDate = parsed;
          break;
        }
      } catch {}
    }
  }

  // Parse time
  const timePattern = /(\d{1,2})\s*(?:am|pm|AM|PM)?\s*(?:to|-)\s*(\d{1,2})\s*(?:am|pm|AM|PM)?/;
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const endHour = parseInt(timeMatch[2]);
    result.startTime = `${startHour.toString().padStart(2, '0')}:00`;
    result.endTime = `${endHour.toString().padStart(2, '0')}:00`;
  }

  // Parse organizer name (simple pattern: name before "organizer")
  const organizerPattern = /(\w+)\s+organizer/i;
  const organizerMatch = text.match(organizerPattern);
  if (organizerMatch) {
    result.organizerName = organizerMatch[1];
  }

  // Parse advance amount
  const advancePattern = /(\d+)\s*(?:rupees?|rs\.?|₹)?\s*advance/i;
  const advanceMatch = text.match(advancePattern);
  if (advanceMatch) {
    result.advancePaid = parseInt(advanceMatch[1]);
  }

  // Parse requirements
  const requirements: EventFormData['requirements'] = {
    cafeteria: lowerText.includes('cafeteria') || lowerText.includes('food'),
    actionCamera: lowerText.includes('camera') || lowerText.includes('recording'),
    canopy: lowerText.includes('canopy') || lowerText.includes('tent'),
    chairs: lowerText.includes('chair') || lowerText.includes('seating'),
    micSystem: lowerText.includes('mic') || lowerText.includes('sound') || lowerText.includes('audio'),
    scoreboard: lowerText.includes('scoreboard') || lowerText.includes('score'),
  };
  
  if (Object.values(requirements).some(v => v)) {
    result.requirements = requirements;
  }

  return result;
}
