import { GuildScheduledEvent } from "discord.js";
import EventEmitter = require("events");
import { generatePartyMessages, PartyMessages } from "./partyMessages";

const MS_IN_A_MINUTE = 60000;

export class StreamHost extends EventEmitter {
  private active: boolean;
  private activeEvent: GuildScheduledEvent<"ACTIVE"> = null;
  private partyMessages: PartyMessages[] | null = null;
  private partyMessageTimers: NodeJS.Timeout[] = [];

  constructor() {
    super();
    this.sendPartyMessage = this.sendPartyMessage.bind(this);
    this.startParty = this.startParty.bind(this);
    this.endParty = this.endParty.bind(this);
    this.initiatePartyMessageSchedule =
      this.initiatePartyMessageSchedule.bind(this);
    this.clearMessageTimers = this.clearMessageTimers.bind(this);
  }

  private sendPartyMessage(
    message: string,
    event: GuildScheduledEvent<"ACTIVE"> = this.activeEvent
  ) {
    this.emit("partyMessage", message, event);
  }

  private initiatePartyMessageSchedule() {
    console.log(this.partyMessages);
    this.partyMessageTimers = this.partyMessages.map((msg) => {
      return setTimeout(() => {
        this.sendPartyMessage(msg.text);
      }, msg.waitTime * MS_IN_A_MINUTE);
    });
  }

  public startParty(event: GuildScheduledEvent<"ACTIVE">) {
    if (this.active) {
      return;
    }

    this.active = true;
    this.activeEvent = event;
    this.partyMessages = generatePartyMessages(event);
    console.log(`New Stream Party Started: ${event.name}`);

    this.initiatePartyMessageSchedule();
  }

  private clearMessageTimers() {
    this.partyMessageTimers.forEach((timer) => clearTimeout(timer));
  }

  public endParty() {
    if (!this.active) {
      return;
    }

    this.emit("partyMessage", "Thanks for hanging out!", this.activeEvent);
    this.clearMessageTimers();
    this.active = false;
    this.activeEvent = null;
    this.partyMessages = null;
    console.log("Stream Party Ended");
  }
}
