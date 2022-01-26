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
}
