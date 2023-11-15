import {
  Collection,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
} from "discord.js";
import EventEmitter = require("events");

export enum EventListenerEvents {
  MONITOR = "eventsMonitored",
  READY = "ready",
}

const FIVE_MINS_IN_MS = 300000;
const MS_IN_A_SEC = 1000;
const SEC_IN_AN_MIN = 60;

export type EventWindow = {
  event: GuildScheduledEvent;
  minTime: number;
  maxTime: number;
};

export class EventsListener extends EventEmitter {
  private events: Collection<string, GuildScheduledEvent>;
  private listenInterval: number;

  constructor() {
    super();
    this.listenInterval = FIVE_MINS_IN_MS;
    this.initialize = this.initialize.bind(this);
    this.addEvent = this.addEvent.bind(this);
    this.updateEvent = this.updateEvent.bind(this);
    this.cancelEvent = this.cancelEvent.bind(this);
  }

  public initialize(events: Collection<string, GuildScheduledEvent>) {
    this.events = events;
    this.monitor();
  }

  private monitor() {
    setInterval(() => {
      const eventWindows = this.events.map((event): EventWindow => {
        const eventStartTimeStamp = event.scheduledStartAt.getTime();
        const now = Date.now();

        const maxTime =
          (eventStartTimeStamp - now) / MS_IN_A_SEC / SEC_IN_AN_MIN;
        const minTime = maxTime - 5;

        return {
          event,
          minTime,
          maxTime,
        };
      });
      this.emit(EventListenerEvents.MONITOR, eventWindows);
    }, this.listenInterval);
    this.emit(
      EventListenerEvents.READY,
      `EventsListener loaded with ${this.events.size} event(s) being monitored`
    );
  }

  public addEvent(
    event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>
  ) {
    this.events.set(event.id, event);
  }

  public updateEvent(
    oldEvent: GuildScheduledEvent<
      | GuildScheduledEventStatus.Active
      | GuildScheduledEventStatus.Completed
      | GuildScheduledEventStatus.Scheduled
    >,
    newEvent: GuildScheduledEvent<
      | GuildScheduledEventStatus.Active
      | GuildScheduledEventStatus.Completed
      | GuildScheduledEventStatus.Scheduled
    >
  ) {
    if (
      newEvent.status === GuildScheduledEventStatus.Active ||
      newEvent.status === GuildScheduledEventStatus.Completed
    ) {
      this.events.delete(newEvent.id);
    }

    if (newEvent.status === GuildScheduledEventStatus.Scheduled) {
      this.events.set(newEvent.id, newEvent);
    }
  }

  public cancelEvent(
    event: GuildScheduledEvent<
      GuildScheduledEventStatus.Canceled | GuildScheduledEventStatus.Scheduled
    >
  ) {
    this.events.delete(event.id);
  }
}
