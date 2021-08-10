import { sub } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  ChannelLogsQueryOptions,
  Collection,
  DMChannel,
  Message,
  MessageEmbed,
  Snowflake,
  TextChannel,
} from "discord.js";
import {
  getDiscussion,
  getNews,
  getTwitter,
  getYouTube,
} from "../actions/utility/generateSummary/filters/";
import {
  generateDiscussionSummary,
  generateLinkSummary,
  generateTwitterSummary,
} from "../actions/utility/generateSummary/reportFieldGenerators/";

export type ReportGeneratorError = {
  dm: string;
  limit: string;
};

export type Report = {
  news?: MessageEmbed;
  youtube?: MessageEmbed;
  twitter?: MessageEmbed;
  discussion?: MessageEmbed;
};

export class ReportGenerator {
  private collections: {
    [key: string]: Collection<string, Message>;
  } = {};
  private reports: {
    [key: string]: Report;
  } = {};
  private notices: {
    [key: string]: string;
  } = {};

  public sendHelp(message: Message) {
    const embed = new MessageEmbed();

    embed
      .setTitle("Getting channel summaries [BETA]")
      .setDescription(
        "You can generate a summary of activity in a channel by calling the `!summary` command. The summary will be sent to you via a DM."
      )
      .addFields([
        {
          name: "Specify time window",
          value:
            "By default, `!summary` will look back 8 hours in its report. You can change this by add a number after the command, up to a maximum of 24 hours. Example: `!summary 12` returns activity from the last twelve hours.",
        },
        {
          name: "Force in channel",
          value:
            "By default, the summary is sent via DM. You can force it to report inside the channel you call it by adding the `here` parameter after the time window. Example: `!summary 8 here` or `!summary here` will create a report for the last 8 hours and post it in to the channel where you call it.",
        },
      ]);

    message.channel.send({ embeds: [embed] });
  }

  public async sendError(message: Message, content: string) {
    await message.channel.send({ content });
  }

  private async fetchMessages(message: Message, hourLimit: number) {
    const DISCORD_API_LIMIT = 100; // Discord's API prevents more than 100 messages per API call

    let messagePoint: Snowflake;
    let messages = new Collection<string, Message>();

    const options: ChannelLogsQueryOptions = {
      limit: DISCORD_API_LIMIT,
    };

    const now = new Date();
    const timeHorizon = sub(now, { hours: hourLimit }); // The oldest Date a message can be to fit within specified window

    const fetcher = async () => {
      if (messagePoint) {
        options.before = messagePoint;
      }

      try {
        const response = await message.channel.messages.fetch(options);
        messagePoint = response.last().id;
        messages = messages.concat(response);
      } catch (err) {
        throw err;
      }

      const timeStamp = new Date(messages.last().createdTimestamp);

      if (timeStamp > timeHorizon) {
        await fetcher(); // recursively call fetcher until the accumulated Collection spans the designated time window.
      }
    };

    try {
      await fetcher();
    } catch (err) {
      throw err;
    }

    // Remove items older than time limit and deleted messages
    // Since the original API calls go in batches, the last batch usually fetches
    // messages past the time limit. This removes them.
    messages =
      messages &&
      messages.filter((msg) => msg.createdAt > timeHorizon && !msg.deleted);

    this.collections[message.channel.id] = messages;
  }

  public getReportId(noticeId: string) {
    return this.notices[noticeId];
  }

  public async sendReport(channel: DMChannel | TextChannel, id: string) {
    const report = this.reports[id];

    if (!report) {
      try {
        await channel.send({
          content:
            "Looks like this report doesn't exist anymore (I don't keep them that long). Try generating a new report with `!summary`!",
        });
      } catch (err) {
        console.error("Couldn't send report to user after clicking emoji.");
      }
    }

    const sender = async () => {
      try {
        const embeds = [];
        Object.keys(report).forEach((reportType) => {
          embeds.push(report[reportType]);
        });
        return channel.send({ embeds });
      } catch (err) {
        console.error("failed to created DM channel with user to send report.");
        throw err;
      }
    };

    const waiter = async () => {
      let count = 0;

      if (count > 9) {
        return await channel.send({
          content: `Sorry, I tried a few times but I can't seem to find this report. Try generating a new one and let Jake know this happened!`,
        });
      }

      if (Object.keys(report).length) {
        sender();
      } else {
        setTimeout(async () => {
          count++;
          await waiter();
        }, 1000);
      }
    };

    waiter();
  }

  private sendChannelReportNotice = async (
    channel: TextChannel,
    hourLimit: number
  ) => {
    let notice: Message;

    try {
      const embed = new MessageEmbed();
      embed
        .setTitle("Channel Summary Report")
        .setDescription(
          `Generating a summary of activity in <#${channel.id}> over the last ${hourLimit} hours and sending to requestor via DM (this make take 5-10 seconds).\n\nWant a copy of this report, too? Click the 📩  below to have one sent to your DMs.`
        );

      notice = await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Failed to create notice in channel.");
      throw err;
    }

    try {
      await notice.react("📩");
    } catch (err) {
      console.error("Failed to send reaction to notice.");
      throw err;
    }

    return notice.id;
  };

  private sendChannelLoadingMessage = async (channel: TextChannel) => {
    try {
      await channel.send({ content: "Generating channel summary report..." });
    } catch (err) {
      console.error("Loading message failed to send to channel.");
      throw err;
    }
  };

  public async generateReport(
    message: Message,
    hourLimit: number = 8,
    forceChannel: boolean = false
  ): Promise<string> {
    if (hourLimit > 24) {
      await this.sendError(
        message,
        "In order to maintain order, please limit summary reports to last 24 hours"
      );
      throw "24 hours is the limit.";
    }

    const reportId = uuidv4();
    this.reports[reportId] = {};
    const report = this.reports[reportId];
    const channelId = message.channel.id;

    // Sends notice or loading message to user, logs notice ID for potential future report requests
    try {
      if (forceChannel) {
        await this.sendChannelLoadingMessage(message.channel as TextChannel);
      } else {
        const noticeId = await this.sendChannelReportNotice(
          message.channel as TextChannel,
          hourLimit
        );
        this.notices[noticeId] = reportId;
      }
    } catch (err) {
      console.error(err);
    }

    // Ensures adaquate message collection size has been fetched to generate report from
    try {
      await this.fetchMessages(message, hourLimit);
    } catch (err) {
      console.error("Error fetching messages from Discord API.");
      console.error(err);
    }

    const collection = this.collections[message.channel.id];

    // Generates sub collections from which reports can be generated
    const twitterCollection = getTwitter(collection);
    const newsCollection = getNews(collection);
    const discussionCollection = getDiscussion(collection);
    const youTubeCollection = getYouTube(collection);

    if (newsCollection.size > 0) {
      report.news = generateLinkSummary(newsCollection, hourLimit, channelId, {
        type: "news",
      });
    }

    if (youTubeCollection.size > 0) {
      report.youtube = generateLinkSummary(
        youTubeCollection,
        hourLimit,
        channelId,
        {
          type: "youtube",
        }
      );
    }

    if (twitterCollection.size > 0) {
      report.twitter = await generateTwitterSummary(
        twitterCollection,
        hourLimit,
        channelId
      );
    }

    if (discussionCollection.size > 0) {
      report.discussion = await generateDiscussionSummary(
        discussionCollection,
        hourLimit,
        channelId
      );
    }

    this.reports[reportId] = report;

    return reportId;
  }
}
