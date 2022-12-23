import {
  ChannelType,
  Client,
  EmbedBuilder,
  EmbedField,
  time,
  TimestampStyles,
} from "discord.js";
import { SpecificChannel, channelIds } from "../types/channelEnums";

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

  constructor(title: string) {
    this.title = title;
  }

  public addLog(
    status: LogStatus,
    value: string,
    inline: boolean = false,
    timestamp: Date = new Date()
  ) {
    const field: EmbedField = {
      name: "\u200B",
      value: `${status} ${time(timestamp, TimestampStyles.LongTime)}: ${value}`,
      inline,
    };

    this.fields.push(field);
  }

  private generateEmbed(): EmbedBuilder {
    const embed = new EmbedBuilder({
      title: this.title + `: ${time(this.date, TimestampStyles.LongDate)}`,
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
