import type { Event, Service } from '../backend';

export interface EventFormData {
  eventName: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  totalAmount: number;
  advancePaid: number;
  eventType: string;
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

function createMetadataService(key: string, value: string): Service {
  return {
    name: `${METADATA_PREFIX}${key}`,
    price: BigInt(0),
  };
}

function createRequirementService(name: string, enabled: boolean): Service | null {
  if (!enabled) return null;
  return {
    name: `${REQUIREMENT_PREFIX}${name}`,
    price: BigInt(0),
  };
}

function getMetadataValue(services: Service[], key: string): string {
  const service = services.find(s => s.name === `${METADATA_PREFIX}${key}`);
  return service ? service.name.replace(`${METADATA_PREFIX}${key}`, '') || '' : '';
}

function parseMetadata(services: Service[]): Partial<EventFormData> {
  const metadata: any = {};
  
  services.forEach(service => {
    if (service.name.startsWith(METADATA_PREFIX)) {
      const key = service.name.replace(METADATA_PREFIX, '').split(':')[0];
      const value = service.name.replace(`${METADATA_PREFIX}${key}:`, '');
      metadata[key] = value;
    }
  });

  return metadata;
}

function parseRequirements(services: Service[]): EventFormData['requirements'] {
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
  
  const eventDate = new Date(Number(event.dateTimestamp) / 1_000_000);
  
  const totalAmount = Number(event.pricePerPerson) * Number(event.attendees) + 
                     (event.flatFee ? Number(event.flatFee) : 0);
  
  return {
    eventName: event.title,
    eventDate,
    startTime: metadata.startTime || '09:00',
    endTime: metadata.endTime || '17:00',
    location: metadata.location || '',
    organizerName: metadata.organizerName || '',
    organizerPhone: metadata.organizerPhone || '',
    organizerEmail: metadata.organizerEmail || '',
    totalAmount,
    advancePaid: Number(event.amountPaid),
    eventType: metadata.eventType || 'Custom',
    requirements,
    specialNotes: metadata.specialNotes || '',
    status: (metadata.status as any) || 'Upcoming',
  };
}

export function formDataToBackendParams(formData: EventFormData) {
  const services: Service[] = [];
  
  // Add metadata services
  services.push({ name: `${METADATA_PREFIX}startTime:${formData.startTime}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}endTime:${formData.endTime}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}location:${formData.location}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}organizerName:${formData.organizerName}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}organizerPhone:${formData.organizerPhone}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}organizerEmail:${formData.organizerEmail}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}eventType:${formData.eventType}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}specialNotes:${formData.specialNotes}`, price: BigInt(0) });
  services.push({ name: `${METADATA_PREFIX}status:${formData.status}`, price: BigInt(0) });
  
  // Add requirement services
  Object.entries(formData.requirements).forEach(([key, enabled]) => {
    const service = createRequirementService(key, enabled);
    if (service) services.push(service);
  });

  const dateTimestamp = BigInt(formData.eventDate.getTime() * 1_000_000);
  
  return {
    title: formData.eventName,
    dateTimestamp,
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
