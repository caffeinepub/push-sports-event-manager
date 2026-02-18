import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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

  // Event Management Types
  type EventId = Nat;

  type Event = {
    id : EventId;
    title : Text;
    dateTimestamp : Time.Time;
    services : [Service];
    attendees : Nat;
    pricePerPerson : Nat;
    flatFee : ?Nat;
    amountPaid : Nat;
    createdAt : Time.Time;
    lastModified : Time.Time;
  };

  type Service = {
    name : Text;
    price : Nat;
  };

  type Requirement = {
    id : Nat;
    description : Text;
    isCompleted : Bool;
  };

  type EventWithSummary = {
    #completed : Event;
    #pendingPayment : Event;
    #overduePayment : Event;
    #upcoming : Event;
    #past : Event;
  };

  module Events {
    public func compareByDate(event1 : Event, event2 : Event) : Order.Order {
      Int.compare(event1.dateTimestamp, event2.dateTimestamp);
    };
  };

  let events = Map.empty<EventId, Event>();
  var nextEventId = 1;

  public shared ({ caller }) func addEvent(
    title : Text,
    dateTimestamp : Time.Time,
    services : [Service],
    attendees : Nat,
    pricePerPerson : Nat,
    flatFee : ?Nat,
    amountPaid : Nat,
  ) : async EventId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create events");
    };

    if (title.isEmpty()) {
      Runtime.trap("Title must not be empty");
    };

    let event : Event = {
      id = nextEventId;
      title;
      dateTimestamp;
      services;
      attendees;
      pricePerPerson;
      flatFee;
      amountPaid;
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
    title : Text,
    dateTimestamp : Time.Time,
    services : [Service],
    attendees : Nat,
    pricePerPerson : Nat,
    flatFee : ?Nat,
    amountPaid : Nat,
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
          title;
          dateTimestamp;
          services;
          attendees;
          pricePerPerson;
          flatFee;
          amountPaid;
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
      case (?_) {
        events.remove(eventId);
      };
    };
  };

  public query ({ caller }) func getEventsByDateRange(
    startTimestamp : Time.Time,
    endTimestamp : Time.Time,
  ) : async [Event] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view events");
    };

    let filtered = events.values().toArray().filter(
      func(event) {
        event.dateTimestamp >= startTimestamp and event.dateTimestamp <= endTimestamp
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
};
