import { Collection, GuildScheduledEvent } from "discord.js";
import EventEmitter = require("events");

const FIVE_MINS_IN_MS = 300000;

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
      console.log("test");
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
