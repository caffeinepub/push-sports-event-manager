import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Service {
    name: string;
    price: bigint;
}
export type Time = bigint;
export type EventId = bigint;
export interface UserProfile {
    name: string;
}
export interface Event {
    id: EventId;
    title: string;
    createdAt: Time;
    pricePerPerson: bigint;
    amountPaid: bigint;
    lastModified: Time;
    attendees: bigint;
    dateTimestamp: Time;
    services: Array<Service>;
    flatFee?: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEvent(title: string, dateTimestamp: Time, services: Array<Service>, attendees: bigint, pricePerPerson: bigint, flatFee: bigint | null, amountPaid: bigint): Promise<EventId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteEvent(eventId: EventId): Promise<void>;
    getAllEvents(): Promise<Array<Event>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEvent(eventId: EventId): Promise<Event>;
    getEventsByDateRange(startTimestamp: Time, endTimestamp: Time): Promise<Array<Event>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEvent(eventId: EventId, title: string, dateTimestamp: Time, services: Array<Service>, attendees: bigint, pricePerPerson: bigint, flatFee: bigint | null, amountPaid: bigint): Promise<void>;
}
