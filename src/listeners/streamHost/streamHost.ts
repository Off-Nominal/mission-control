import { GuildScheduledEvent } from "discord.js";
import EventEmitter = require("events");

export class StreamHost extends EventEmitter {
  constructor() {
    super();
  }

  public startParty(event: GuildScheduledEvent<"ACTIVE">) {
    console.log("Let's get this party started!");
    console.log(event.name);
  }
}
