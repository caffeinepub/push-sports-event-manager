import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Event, EventId, UserProfile, Service } from '../backend';
import { toast } from 'sonner';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllEvents() {
  const { actor, isFetching } = useActor();

  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEvent(eventId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getEvent(BigInt(eventId));
    },
    enabled: !!actor && !isFetching && !!eventId,
  });
}

export function useAddEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      dateTimestamp: bigint;
      services: Service[];
      attendees: bigint;
      pricePerPerson: bigint;
      flatFee: bigint | null;
      amountPaid: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEvent(
        params.title,
        params.dateTimestamp,
        params.services,
        params.attendees,
        params.pricePerPerson,
        params.flatFee,
        params.amountPaid
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });
}

export function useUpdateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      eventId: EventId;
      title: string;
      dateTimestamp: bigint;
      services: Service[];
      attendees: bigint;
      pricePerPerson: bigint;
      flatFee: bigint | null;
      amountPaid: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateEvent(
        params.eventId,
        params.title,
        params.dateTimestamp,
        params.services,
        params.attendees,
        params.pricePerPerson,
        params.flatFee,
        params.amountPaid
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId.toString()] });
      toast.success('Event updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: EventId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });
}
