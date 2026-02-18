import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type EventId = Nat;
  type OldEvent = {
    id : EventId;
    externalId : ?Text;
    title : Text;
    dateTimestamp : Time.Time;
    services : [OldService];
    attendees : Nat;
    pricePerPerson : Nat;
    flatFee : ?Nat;
    amountPaid : Nat;
    createdAt : Time.Time;
    lastModified : Time.Time;
  };

  type OldService = {
    name : Text;
    price : Nat;
  };

  type NewEvent = {
    id : EventId;
    externalId : ?Text;
    title : Text;
    dateRange : NewDateRange;
    sports : [Text];
    services : [NewService];
    attendees : Nat;
    pricePerPerson : Nat;
    flatFee : ?Nat;
    amountPaid : Nat;
    createdAt : Time.Time;
    lastModified : Time.Time;
  };

  type NewService = {
    name : Text;
    price : Nat;
  };

  type NewDateRange = {
    from : Time.Time;
    to : Time.Time;
  };

  type OldActor = {
    events : Map.Map<EventId, OldEvent>;
    externalIdToEventId : Map.Map<Text, EventId>;
    nextEventId : Nat;
  };

  type NewActor = {
    events : Map.Map<EventId, NewEvent>;
    externalIdToEventId : Map.Map<Text, EventId>;
    nextEventId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newEvents = old.events.map<EventId, OldEvent, NewEvent>(
      func(_id, oldEvent) {
        {
          oldEvent with
          dateRange = {
            from = oldEvent.dateTimestamp;
            to = oldEvent.dateTimestamp;
          };
          sports = [];
        }
      }
    );
    {
      old with events = newEvents;
    };
  };
};
