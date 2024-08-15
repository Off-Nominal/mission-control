import {
  ChannelType,
  Client,
  EmbedBuilder,
  EmbedField,
  time,
  TimestampStyles,
} from "discord.js";
import mcconfig from "../mcconfig";

export enum LogStatus {
  SUCCESS = "✅",
  FAILURE = "❌",
  INFO = "💬",
  WARNING = "⚠️",
}

export enum LogInitiator {
  SERVER = "Server",
  DISCORD = "Discord",
  RLL = "RLL CLient",
  NDB2 = "NDB2",
}

export class Logger {
  private fields: EmbedField[] = [];
  private date: Date = new Date();
  private title: string;
  private description: string;
  private sent: boolean = false;

  constructor(
    title: string,
    initiator: LogInitiator,
    eventName: string,
    fallbackClient?: Client
  ) {
    this.title = title;
    this.description = `Initiated by: ${initiator}\nEvent Name: ${eventName}`;

    // Sends log after 3 minutes if not sent to catch errors where thread crashes
    if (!fallbackClient) {
      return;
    }

    setTimeout(() => {
      if (!this.sent) {
        this.addLog(
          LogStatus.FAILURE,
          "Log was not sent after 3 minutes. Fallback Client used."
        );
        this.sendLog(fallbackClient)
          .then(() => {
            this.sent = true;
          })
          .catch((err) => {
            console.error("Failed to Send Log using fallback client");
          });
      }
    }, 180000);
  }

  public addLog(
    status: LogStatus,
    value: string,
    inline: boolean = false,
    timestamp: Date = new Date()
  ) {
    const text = `${status} ${time(
      timestamp,
      TimestampStyles.LongTime
    )}: ${value}`;

    const field: EmbedField = {
      name: "\u200B",
      value: text.slice(0, 1023),
      inline,
    };

    this.fields.push(field);
  }

  private generateEmbed(): EmbedBuilder {
    const embed = new EmbedBuilder({
      title: this.title + `: ${time(this.date, TimestampStyles.LongDate)}`,
      description: this.description,
      fields: this.fields,
    });

    return embed;
  }

  public async sendLog(client: Client) {
    const embed = this.generateEmbed();

    try {
      const channel = await client.channels.fetch(
        mcconfig.discord.channels.bots
      );
      if (!channel) {
        throw new Error("Channel not found.");
      }

      if (channel.type !== ChannelType.GuildText) {
        throw new Error("Tried to send log to non-text based channel.");
      }

      await channel.send({ embeds: [embed] });
      this.sent = true;
    } catch (err) {
      console.error("Failed to Send Log");
      console.error(err);
    }
  }
}
