import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DateRange {
    to: Time;
    from: Time;
}
export type Time = bigint;
export interface EventInput {
    title: string;
    pricePerPerson: bigint;
    amountPaid: bigint;
    attendees: bigint;
    sports: Array<string>;
    dateRange: DateRange;
    services: Array<Service>;
    flatFee?: bigint;
}
export type EventId = bigint;
export interface Event {
    id: EventId;
    title: string;
    externalId?: string;
    createdAt: Time;
    pricePerPerson: bigint;
    amountPaid: bigint;
    lastModified: Time;
    attendees: bigint;
    sports: Array<string>;
    dateRange: DateRange;
    services: Array<Service>;
    flatFee?: bigint;
}
export interface Service {
    name: string;
    price: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEvent(input: EventInput): Promise<EventId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteEvent(eventId: EventId): Promise<void>;
    getAllEvents(): Promise<Array<Event>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEvent(eventId: EventId): Promise<Event>;
    getEventsByDateRange(range: DateRange): Promise<Array<Event>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEvent(eventId: EventId, input: EventInput): Promise<void>;
    upsertManyEvents(eventsToUpsert: Array<Event>): Promise<void>;
}
