import {
  ChannelType,
  Client,
  EmbedBuilder,
  EmbedField,
  time,
  TimestampStyles,
} from "discord.js";
import { SpecificChannel, channelIds } from "../types/channelEnums";
import { LogInitiator } from "../types/logEnums";

export enum LogStatus {
  SUCCESS = "✅",
  FAILURE = "❌",
  INFO = "💬",
  WARNING = "⚠️",
}

export class Logger {
  private fields: EmbedField[] = [];
  private date: Date = new Date();
  private title: string;
  private description: string;

  constructor(title: string, initiator: LogInitiator, eventName: string) {
    this.title = title;
    this.description = `Initiated by: ${initiator}\nEvent Name: ${eventName}`;
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

    const channel = await client.channels.fetch(
      channelIds[SpecificChannel.BOTS]
    );
    if (channel.type === ChannelType.GuildText) {
      channel.send({ embeds: [embed] });
    } else {
      console.error("Tried to send log to non-text based channel.");
    }
  }
}
