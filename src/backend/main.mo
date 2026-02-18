import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type EventId = Nat;
  public type Event = {
    id : EventId;
    externalId : ?Text;
    title : Text;
    dateRange : DateRange;
    sports : [Text];
    services : [Service];
    attendees : Nat;
    pricePerPerson : Nat;
    flatFee : ?Nat;
    amountPaid : Nat;
    createdAt : Time.Time;
    lastModified : Time.Time;
  };

  public type Service = {
    name : Text;
    price : Nat;
  };

  public type DateRange = {
    from : Time.Time;
    to : Time.Time;
  };

  public type EventInput = {
    title : Text;
    dateRange : DateRange;
    sports : [Text];
    services : [Service];
    attendees : Nat;
    pricePerPerson : Nat;
    flatFee : ?Nat;
    amountPaid : Nat;
  };

  module Events {
    public func compareByDate(event1 : Event, event2 : Event) : Order.Order {
      Int.compare(event1.dateRange.from, event2.dateRange.from);
    };
  };

  let events = Map.empty<EventId, Event>();
  let externalIdToEventId = Map.empty<Text, EventId>();

  var nextEventId = 1;

  public shared ({ caller }) func addEvent(
    input : EventInput,
  ) : async EventId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create events");
    };

    if (input.title.isEmpty()) {
      Runtime.trap("Title must not be empty");
    };

    let event : Event = {
      id = nextEventId;
      externalId = null;
      title = input.title;
      dateRange = input.dateRange;
      sports = input.sports;
      services = input.services;
      attendees = input.attendees;
      pricePerPerson = input.pricePerPerson;
      flatFee = input.flatFee;
      amountPaid = input.amountPaid;
      createdAt = Time.now();
      lastModified = Time.now();
    };

    events.add(nextEventId, event);
    nextEventId += 1;
    event.id;
  };

  public query ({ caller }) func getEvent(eventId : EventId) : async Event {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view events");
    };

    switch (events.get(eventId)) {
      case (null) {
        Runtime.trap("Event does not exist");
      };
      case (?event) { event };
    };
  };

  public shared ({ caller }) func updateEvent(
    eventId : EventId,
    input : EventInput,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update events");
    };

    switch (events.get(eventId)) {
      case (null) {
        Runtime.trap("Event does not exist");
      };
      case (?existingEvent) {
        let event : Event = {
          id = eventId;
          externalId = existingEvent.externalId;
          title = input.title;
          dateRange = input.dateRange;
          sports = input.sports;
          services = input.services;
          attendees = input.attendees;
          pricePerPerson = input.pricePerPerson;
          flatFee = input.flatFee;
          amountPaid = input.amountPaid;
          createdAt = existingEvent.createdAt;
          lastModified = Time.now();
        };
        events.add(eventId, event);
      };
    };
  };

  public shared ({ caller }) func deleteEvent(eventId : EventId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete events");
    };

    switch (events.get(eventId)) {
      case (null) {
        Runtime.trap("Event does not exist");
      };
      case (?event) {
        events.remove(eventId);
        switch (event.externalId) {
          case (?externalId) { externalIdToEventId.remove(externalId) };
          case (null) {};
        };
      };
    };
  };

  public query ({ caller }) func getEventsByDateRange(
    range : DateRange,
  ) : async [Event] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view events");
    };

    let filtered = events.values().toArray().filter(
      func(event) {
        event.dateRange.from >= range.from and event.dateRange.to <= range.to
      }
    );
    filtered.sort(Events.compareByDate);
  };

  public query ({ caller }) func getAllEvents() : async [Event] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view events");
    };

    events.values().toArray().sort(Events.compareByDate);
  };

  public shared ({ caller }) func upsertManyEvents(eventsToUpsert : [Event]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upsert events");
    };

    let processedExternalIds = Set.empty<Text>();

    for (event in eventsToUpsert.values()) {
      let hasExternalId = switch (event.externalId) {
        case (?externalId) {
          not processedExternalIds.contains(externalId) and isValidExternalId(externalId);
        };
        case (null) { false };
      };

      if (hasExternalId) {
        switch (event.externalId) {
          case (null) {}; 
          case (?externalId) {
            processedExternalIds.add(externalId);
            switch (externalIdToEventId.get(externalId)) {
              case (?existingId) {
                updateExistingEvent(existingId, event, Time.now());
              };
              case (null) {
                if (event.title.isEmpty()) {
                  Runtime.trap("Title must not be empty");
                };
                let newEvent = createNewEvent(event, externalId, Time.now());
                events.add(newEvent.id, newEvent);
                externalIdToEventId.add(externalId, newEvent.id);
              };
            };
          };
        };
      };
    };
  };

  func createNewEvent(event : Event, externalId : Text, timestamp : Time.Time) : Event {
    {
      id = nextEventId;
      externalId = ?externalId;
      title = event.title;
      dateRange = event.dateRange;
      sports = event.sports;
      services = event.services;
      attendees = event.attendees;
      pricePerPerson = event.pricePerPerson;
      flatFee = event.flatFee;
      amountPaid = event.amountPaid;
      createdAt = timestamp;
      lastModified = timestamp;
    };
  };

  func updateExistingEvent(existingId : EventId, event : Event, timestamp : Time.Time) {
    switch (events.get(existingId)) {
      case (?existingEvent) {
        let updatedEvent = {
          id = existingEvent.id;
          externalId = event.externalId;
          title = event.title;
          dateRange = event.dateRange;
          sports = event.sports;
          services = event.services;
          attendees = event.attendees;
          pricePerPerson = event.pricePerPerson;
          flatFee = event.flatFee;
          amountPaid = event.amountPaid;
          createdAt = existingEvent.createdAt;
          lastModified = timestamp;
        };
        events.add(existingId, updatedEvent);
      };
      case (null) {};
    };
  };

  func isValidExternalId(id : Text) : Bool {
    not id.isEmpty() and id.endsWith(#char ' ');
  };
};
