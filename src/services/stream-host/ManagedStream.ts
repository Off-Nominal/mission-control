import {
  CommandInteraction,
  GuildMember,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessageCreateOptions,
  MessagePayload,
  ThreadChannel,
} from "discord.js";
import EventEmitter = require("events");
import {
  generatePartyMessages,
  PartyMessage,
  streamTitleEmbed,
  TitleSuggestion,
} from "./partyMessages";
import { createPollEmbed } from "../../actions/create-poll-embed";
import { SanityClient } from "@sanity/client";

const MS_IN_A_MINUTE = 60000;
const MAX_TITLE_SUGGESTIONS = 36;

export class ManagedStream extends EventEmitter {
  private active: boolean;
  private partyMessages: PartyMessage[] | null = null;
  private partyMessageTimers: NodeJS.Timeout[] = [];
  private titleSuggestions: TitleSuggestion[] = [];
  private sanityClient: SanityClient;
  private forumPost: ThreadChannel | null = null;

  constructor(sanityClient: SanityClient) {
    super();
    this.sanityClient = sanityClient;
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
    message: string | MessagePayload | MessageCreateOptions
  ) {
    try {
      this.forumPost.send(message);
    } catch (err) {
      console.error(err);
    }
  }

  private initiatePartyMessageSchedule() {
    this.partyMessageTimers = this.partyMessages.map((msg) => {
      return setTimeout(() => {
        this.sendPartyMessage(msg.text);
      }, msg.waitTime * MS_IN_A_MINUTE);
    });
  }

  public async startParty(
    event: GuildScheduledEvent<GuildScheduledEventStatus.Active>,
    forumPost: ThreadChannel
  ) {
    if (this.active) {
      return;
    }

    this.forumPost = forumPost;
    this.active = true;
    this.partyMessages = await generatePartyMessages(event, this.sanityClient);

    this.initiatePartyMessageSchedule();
    setTimeout(() => {
      this.sendPartyMessage({ embeds: [streamTitleEmbed] });
    });
  }

  private clearMessageTimers() {
    this.partyMessageTimers.forEach((timer) => clearTimeout(timer));
  }

  public endParty(): void {
    if (!this.active) {
      return;
    }

    const embed = createPollEmbed(
      "Vote on your favourite title suggestion",
      this.titleSuggestions.map(
        (sugg) => `**"${sugg.title}"** by *${sugg.suggester.displayName}*`
      )
    );

    this.clearMessageTimers();
    this.forumPost = null;
    this.active = false;
    this.partyMessages = null;
    this.titleSuggestions = [];

    const message = {
      content: "Thanks for hanging out everyone!",
      embeds: [embed],
    };

    this.forumPost.send(message);
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
          `Actually, I'm not that sophisticated of a bot, and I can only remember like ${MAX_TITLE_SUGGESTIONS} suggestions at a time. If you've reached this point, this is either a really funny episode (not likely), or you're trying to break me (likely) and maybe you should get some new hobbies or something.`
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
        content: `Logged your suggestion of **"${title}"**!\n\nTo view the currently logged suggestions, use \`/events suggestions\``,
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
