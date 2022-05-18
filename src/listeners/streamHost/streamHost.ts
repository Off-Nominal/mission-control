import {
  CommandInteraction,
  GuildMember,
  GuildScheduledEvent,
  MessageOptions,
  MessagePayload,
} from "discord.js";
import EventEmitter = require("events");
import createPollEmbed from "../../clients/main/actions/poll/createPollEmbed";
import {
  generatePartyMessages,
  PartyMessages,
  streamTitleEmbed,
  TitleSuggestion,
} from "./partyMessages";

const MS_IN_A_MINUTE = 60000;
const MAX_TITLE_SUGGESTIONS = 36;

export class StreamHost extends EventEmitter {
  private active: boolean;
  private activeEvent: GuildScheduledEvent<"ACTIVE"> = null;
  private partyMessages: PartyMessages[] | null = null;
  private partyMessageTimers: NodeJS.Timeout[] = [];
  private titleSuggestions: TitleSuggestion[] = [];

  constructor() {
    super();
    this.sendPartyMessage = this.sendPartyMessage.bind(this);
    this.startParty = this.startParty.bind(this);
    this.endParty = this.endParty.bind(this);
    this.initiatePartyMessageSchedule =
      this.initiatePartyMessageSchedule.bind(this);
    this.clearMessageTimers = this.clearMessageTimers.bind(this);
    this.logSuggestion = this.logSuggestion.bind(this);
    this.viewSuggestions = this.viewSuggestions.bind(this);
  }

  private sendPartyMessage(
    message: string | MessagePayload | MessageOptions,
    event: GuildScheduledEvent<"ACTIVE"> = this.activeEvent
  ) {
    this.emit("partyMessage", message, event);
  }

  private initiatePartyMessageSchedule() {
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
    setTimeout(() => {
      this.emit(
        "partyMessage",
        { embeds: [streamTitleEmbed] },
        this.activeEvent
      );
    });
  }

  private clearMessageTimers() {
    this.partyMessageTimers.forEach((timer) => clearTimeout(timer));
  }

  public endParty() {
    if (!this.active) {
      return;
    }

    this.emit(
      "partyMessage",
      {
        content: "Thanks for hanging out everyone!",
        embeds: [
          createPollEmbed(
            "Vote on your favourite title suggestion",
            this.titleSuggestions.map(
              (sugg) => `**"${sugg.title}"** by *${sugg.suggester.displayName}*`
            )
          ),
        ],
      },
      this.activeEvent
    );

    this.clearMessageTimers();
    this.active = false;
    this.activeEvent = null;
    this.partyMessages = null;
    this.titleSuggestions = [];
    console.log("Stream Party Ended");
  }

  public eventActive() {
    return this.active;
  }

  public async logSuggestion(title: string, interaction: CommandInteraction) {
    if (!this.active) {
      try {
        await interaction.reply({
          content: `This command only works during a live Off-Nominal episode stream.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (this.titleSuggestions.length >= MAX_TITLE_SUGGESTIONS) {
      try {
        await interaction.reply(
          `Actually, I'm not that sophisticated of a bot, and I can only remember 26 suggestions at a time. If you've reached this point, this is either a really funny episode (not likely), or you're trying to break me (likely) and maybe you should get some new hobbies or something.`
        );
      } catch (err) {
        console.error(err);
      }

      return;
    }

    this.titleSuggestions.push({
      title,
      suggester: interaction.member as GuildMember,
    });

    try {
      await interaction.reply({
        content: `Logged your suggestion of **"${title}"**!\n\nTo view the currently logged suggestsions, use \`/events suggestions\``,
      });
    } catch (err) {
      console.error(err);
    }
  }

  public async viewSuggestions(interaction: CommandInteraction) {
    if (!this.active) {
      try {
        await interaction.reply({
          content: `This command only works during a live Off-Nominal episode stream.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }

      return;
    }

    try {
      await interaction.reply({
        embeds: [
          createPollEmbed(
            "Current suggestions so far",
            this.titleSuggestions.map(
              (sugg) => `**"${sugg.title}"** by *${sugg.suggester.displayName}*`
            )
          ),
        ],
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
    }
  }
}
