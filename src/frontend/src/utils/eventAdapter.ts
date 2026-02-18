import type { Event, EventInput } from '../backend';

export interface EventFormData {
  eventName: string;
  eventDateFrom: Date;
  eventDateTo: Date;
  startTime: string;
  endTime: string;
  location: string;
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  totalAmount: number;
  advancePaid: number;
  sports: string[];
  requirements: {
    cafeteria: boolean;
    actionCamera: boolean;
    canopy: boolean;
    chairs: boolean;
    micSystem: boolean;
    scoreboard: boolean;
  };
  specialNotes: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

export interface EnrichedEvent extends Event {
  formData: EventFormData;
  totalAmount: number;
  pendingAmount: number;
}

const METADATA_PREFIX = 'metadata:';
const REQUIREMENT_PREFIX = 'req:';

function parseMetadata(services: Array<{ name: string; price: bigint }>): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  services.forEach(service => {
    if (service.name.startsWith(METADATA_PREFIX)) {
      const key = service.name.replace(METADATA_PREFIX, '').split(':')[0];
      const value = service.name.replace(`${METADATA_PREFIX}${key}:`, '');
      metadata[key] = value;
    }
  });

  return metadata;
}

function parseRequirements(services: Array<{ name: string; price: bigint }>): EventFormData['requirements'] {
  const requirements = {
    cafeteria: false,
    actionCamera: false,
    canopy: false,
    chairs: false,
    micSystem: false,
    scoreboard: false,
  };

  services.forEach(service => {
    if (service.name.startsWith(REQUIREMENT_PREFIX)) {
      const reqName = service.name.replace(REQUIREMENT_PREFIX, '');
      if (reqName in requirements) {
        requirements[reqName as keyof typeof requirements] = true;
      }
    }
  });

  return requirements;
}

export function eventToFormData(event: Event): EventFormData {
  const metadata = parseMetadata(event.services);
  const requirements = parseRequirements(event.services);
  
  const eventDateFrom = new Date(Number(event.dateRange.from) / 1_000_000);
  const eventDateTo = new Date(Number(event.dateRange.to) / 1_000_000);
  
  const totalAmount = Number(event.pricePerPerson) * Number(event.attendees) + 
                     (event.flatFee ? Number(event.flatFee) : 0);
  
  // Backward compatibility: derive sports from eventType if sports array is empty
  let sports = event.sports && event.sports.length > 0 ? [...event.sports] : [];
  if (sports.length === 0 && metadata['eventType']) {
    sports = [metadata['eventType']];
  }
  
  return {
    eventName: event.title,
    eventDateFrom,
    eventDateTo,
    startTime: metadata['startTime'] || '09:00',
    endTime: metadata['endTime'] || '17:00',
    location: metadata['location'] || '',
    organizerName: metadata['organizerName'] || '',
    organizerPhone: metadata['organizerPhone'] || '',
    organizerEmail: metadata['organizerEmail'] || '',
    totalAmount,
    advancePaid: Number(event.amountPaid),
    sports,
    requirements,
    specialNotes: metadata['specialNotes'] || '',
    status: (metadata['status'] as any) || 'Upcoming',
  };
}

export function formDataToBackendInput(formData: EventFormData): EventInput {
  const services: Array<{ name: string; price: bigint }> = [];
  
  // Add metadata services
  services.push({ name: `${METADATA_PREFIX}startTime:${formData.startTime}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}endTime:${formData.endTime}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}location:${formData.location}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}organizerName:${formData.organizerName}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}organizerPhone:${formData.organizerPhone}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}organizerEmail:${formData.organizerEmail}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}specialNotes:${formData.specialNotes}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}status:${formData.status}`, price: BigInt(0) });
  
  // Add requirement services
  Object.entries(formData.requirements).forEach(([key, enabled]) => {
    if (enabled) {
      services.push({ name: `${REQUIREMENT_PREFIX}${key}`, price: BigInt(0) });
    }
  });

  const dateFrom = BigInt(formData.eventDateFrom.getTime() * 1_000_000);
  const dateTo = BigInt(formData.eventDateTo.getTime() * 1_000_000);
  
  return {
    title: formData.eventName,
    dateRange: {
      from: dateFrom,
      to: dateTo,
    },
    sports: formData.sports,
    services,
    attendees: BigInt(1),
    pricePerPerson: BigInt(0),
    flatFee: BigInt(formData.totalAmount),
    amountPaid: BigInt(formData.advancePaid),
  };
}

export function enrichEvent(event: Event): EnrichedEvent {
  const formData = eventToFormData(event);
  const totalAmount = formData.totalAmount;
  const pendingAmount = Math.max(0, totalAmount - formData.advancePaid);
  
  return {
    ...event,
    formData,
    totalAmount,
    pendingAmount,
  };
}

export function getPrimaryDate(event: Event): Date {
  return new Date(Number(event.dateRange.from) / 1_000_000);
}
