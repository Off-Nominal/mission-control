import { GuildScheduledEvent } from "discord.js";
import EventEmitter = require("events");
import { generatePartyMessages, PartyMessages } from "./partyMessages";

export class StreamHost extends EventEmitter {
  private active: boolean;
  private activeEvent: GuildScheduledEvent<"ACTIVE"> = null;
  private partyMessages: PartyMessages | null = null;

  constructor() {
    super();
    this.sendPartyMessage = this.sendPartyMessage.bind(this);
    this.startParty = this.startParty.bind(this);
    this.endParty = this.endParty.bind(this);
  }

  private sendPartyMessage(
    key: string,
    event: GuildScheduledEvent<"ACTIVE"> = this.activeEvent
  ) {
    this.emit("partyMessage", this.partyMessages[key], event);
  }

  public startParty(event: GuildScheduledEvent<"ACTIVE">) {
    if (this.active) {
      return;
    } else {
      this.active = true;
      this.activeEvent = event;
      this.partyMessages = generatePartyMessages(event);
      console.log(`New Stream Party Started: ${event.name}`);
    }

    setTimeout(() => {
      this.sendPartyMessage("welcome");
    }, 5000);
  }

  private endParty() {
    this.active = false;
    this.activeEvent = null;
    this.partyMessages = null;
    console.log("Stream Party Ended");
  }
}
