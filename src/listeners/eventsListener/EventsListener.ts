import { Collection, GuildScheduledEvent } from "discord.js";
import EventEmitter = require("events");
import { EventListenerEvents } from "../../clients/types";

const FIVE_MINS_IN_MS = 300000;
const MS_IN_A_SEC = 1000;
const SEC_IN_AN_MIN = 60;

export type EventWindow = {
  event: GuildScheduledEvent<"SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELED">;
  minTime: number;
  maxTime: number;
};

export class EventsListener extends EventEmitter {
  private events: Collection<
    string,
    GuildScheduledEvent<"SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELED">
  >;
  private listenInterval: number;

  constructor() {
    super();
    this.listenInterval = FIVE_MINS_IN_MS;
    this.initialize = this.initialize.bind(this);
    this.addEvent = this.addEvent.bind(this);
    this.updateEvent = this.updateEvent.bind(this);
    this.cancelEvent = this.cancelEvent.bind(this);
  }

  public initialize(
    events: Collection<
      string,
      GuildScheduledEvent<"SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELED">
    >
  ) {
    this.events = events;
    console.log(
      `EventsListener loaded with ${events.size} event(s) being monitored`
    );
    this.monitor();
  }

  private monitor() {
    const interval = setInterval(() => {
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
  }

  public addEvent(event: GuildScheduledEvent<"SCHEDULED">) {
    this.events.set(event.id, event);
  }

  public updateEvent(
    oldEvent: GuildScheduledEvent<"COMPLETED" | "ACTIVE" | "SCHEDULED">,
    newEvent: GuildScheduledEvent<"COMPLETED" | "ACTIVE" | "SCHEDULED">
  ) {
    if (newEvent.status === "ACTIVE" || newEvent.status === "COMPLETED") {
      this.events.delete(newEvent.id);
    }

    if (newEvent.status === "SCHEDULED") {
      this.events.set(newEvent.id, newEvent);
    }
  }

  public cancelEvent(event: GuildScheduledEvent<"CANCELED" | "SCHEDULED">) {
    this.events.delete(event.id);
  }
}
