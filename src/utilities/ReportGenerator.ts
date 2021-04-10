import { sub } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  APIMessageContentResolvable,
  ChannelLogsQueryOptions,
  Collection,
  DMChannel,
  Message,
  MessageAdditions,
  MessageEmbed,
  MessageOptions,
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

  error: {
    dm: "My summary function doesn't work great via DM. Try calling me from a channel!";
    limit: "In order to maintain order, please limit summary reports to last 24 hours";
  };

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

    message.channel.send(embed);
  }

  public async sendError(message: Message, type: string) {
    await message.channel.send(this.error[type]);
  }

  private async fetchMessages(message: Message, timeHorizon: Date) {
    const DISCORD_API_LIMIT = 100; // Discord's API prevents more than 100 messages per API call

    let messagePoint: Snowflake;
    let messages = new Collection<string, Message>();

    const options: ChannelLogsQueryOptions = {
      limit: DISCORD_API_LIMIT,
    };

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

    // Remove items older than time limit
    // Since the original API calls go in batches, the last batch usually fetches
    // messages past the time limit. This removes them.
    messages =
      messages && messages.filter((msg) => msg.createdAt > timeHorizon);
    this.collections[message.channel.id] = messages;
  }

  public getReportId(noticeId: string) {
    return this.notices[noticeId];
  }

  public async sendReport(
    channel: DMChannel | TextChannel,
    id: string,
    destination: "dm" | "channel" = "dm"
  ) {
    const report = this.reports[id];

    if (!report) {
      try {
        await channel.send(
          `Looks like this report doesn't exist anymore (I don't keep them that long). Try generating a new report with \`!summary\`!`
        );
      } catch (err) {
        console.error("Couldn't send report to user after clicking emoji.");
      }
    }

    const sender = async () => {
      const sends = [];
      try {
        if (destination === "dm") {
          Object.keys(report).forEach((reportType) => {
            sends.push(channel.send(report[reportType]));
          });
        } else {
          Object.keys(report).forEach((reportType) => {
            sends.push(channel.send(report[reportType]));
          });
        }
      } catch (err) {
        console.error("failed to created DM channel with user to send report.");
      }

      return Promise.all(sends).catch((err) => {
        throw err;
      });
    };

    const waiter = async () => {
      let count = 0;

      if (count > 9) {
        return await channel.send(
          `Sorry, I tried a few times but I can't seem to find this report. Try generating a new one and let Jake know this happened!`
        );
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

  public async generateReport(
    message: Message,
    hourLimit: number = 8,
    forceChannel: boolean = false
  ): Promise<string> {
    if (hourLimit > 24) {
      await this.sendError(message, "hourLimit");
      throw "24 hours is the limit.";
    }

    const reportId = uuidv4();
    this.reports[reportId] = {};
    const report = this.reports[reportId];
    const channelId = message.channel.id;
    const dmChannel = await message.author.createDM();

    const send = (
      contents:
        | APIMessageContentResolvable
        | (MessageOptions & { split?: false })
        | MessageAdditions,
      destination: "dm" | "channel" = forceChannel ? "channel" : "dm"
    ) =>
      destination === "dm"
        ? dmChannel.send(contents)
        : message.channel.send(contents);

    if (forceChannel) {
      try {
        await send("Generating channel summary report...", "channel");
      } catch (err) {
        console.error("Loading message failed to send to channel.");
      }
    } else {
      let notice: Message;

      try {
        const embed = new MessageEmbed();
        embed
          .setTitle("Channel Summary Report")
          .setDescription(
            `I am now generating a summary of the activity in <#${channelId}> over the last ${hourLimit} hours. Check your DMs for the report!\n\nDo you want a copy of the report, too? Click the envelope icon below to have one sent to your DMs.`
          );

        notice = await send(embed, "channel");
        this.notices[notice.id] = reportId;
      } catch (err) {
        console.error("Failed to create notice in channel.");
      }

      try {
        await notice.react("📩");
      } catch (err) {
        console.error("Failed to send reaction to notice.");
        console.error(err);
      }
    }

    const now = new Date();
    const timeLimit = sub(now, { hours: hourLimit }); // The oldest Date a message can be to fit within specified window

    try {
      await this.fetchMessages(message, timeLimit);
    } catch (err) {
      console.error("Error fetching messages from Discord API.");
      console.error(err);
    }

    const collection = this.collections[message.channel.id];

    //generate collections for summary sections
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
