import {
  Client,
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
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";

const MS_IN_A_MINUTE = 60000;
const MAX_TITLE_SUGGESTIONS = 36;

export class ManagedStream extends EventEmitter {
  private active: boolean = false;
  private partyMessages: PartyMessage[] | null = null;
  private partyMessageTimers: NodeJS.Timeout[] = [];
  private titleSuggestions: TitleSuggestion[] = [];
  private forumPost: ThreadChannel | null = null;

  constructor(private sanityClient: SanityClient, private client: Client) {
    super();
    this.sanityClient = sanityClient;
    this.sendPartyMessage = this.sendPartyMessage.bind(this);
    this.startParty = this.startParty.bind(this);
    this.endParty = this.endParty.bind(this);
    this.clearMessageTimers = this.clearMessageTimers.bind(this);
    this.logSuggestion = this.logSuggestion.bind(this);
    this.viewSuggestions = this.viewSuggestions.bind(this);
  }

  private sendPartyMessage(
    message: string | MessagePayload | MessageCreateOptions
  ) {
    if (!this.forumPost) {
      throw new Error("No forum post to send message to");
    }
    return this.forumPost.send(message);
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
    const logger = new Logger(
      "StreamHost",
      LogInitiator.DISCORD,
      "Party Start"
    );

    try {
      this.partyMessages = await generatePartyMessages(
        event,
        this.sanityClient
      );
      logger.addLog(LogStatus.SUCCESS, "Party messages generated");
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Error generating party messages");
      logger.sendLog(this.client);
      return;
    }

    this.partyMessageTimers = this.partyMessages.map((msg) => {
      return setTimeout(() => {
        this.sendPartyMessage(msg.text);
      }, msg.waitTime * MS_IN_A_MINUTE);
    });

    try {
      await this.sendPartyMessage({ embeds: [streamTitleEmbed] });
      logger.addLog(LogStatus.SUCCESS, "Send party welcome message");
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Error sending party welcome message");
      return;
    }

    logger.sendLog(this.client);
  }

  private clearMessageTimers() {
    this.partyMessageTimers.forEach((timer) => clearTimeout(timer));
  }

  public endParty(): void {
    if (!this.active) {
      return;
    }

    if (!this.forumPost) {
      throw new Error("No forum post to send message to");
    }

    const embed = createPollEmbed(
      "Vote on your favourite title suggestion",
      this.titleSuggestions.map(
        (sugg) => `**"${sugg.title}"** by *${sugg.suggester.displayName}*`
      )
    );

    const message = {
      content: "Thanks for hanging out everyone!",
      embeds: [embed],
    };

    this.forumPost.send(message);

    this.clearMessageTimers();
    this.forumPost = null;
    this.active = false;
    this.partyMessages = null;
    this.titleSuggestions = [];
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
