import { sub } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  ChannelLogsQueryOptions,
  Collection,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageEmbed,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import {
  getDiscussion,
  getNews,
  getTwitter,
  getYouTube,
} from "../clients/main/actions/generateSummary/filters";
import {
  generateDiscussionSummary,
  generateLinkSummary,
  generateTwitterSummary,
} from "../clients/main/actions/generateSummary/reportFieldGenerators";

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

  constructor() {
    this.handleReportRequest = this.handleReportRequest.bind(this);
    this.handleSendRequest = this.handleSendRequest.bind(this);
  }

  private sendChannelReportNotice = async (
    interaction: CommandInteraction,
    hourLimit: number
  ) => {
    const embed = new MessageEmbed({
      title: "Channel Summary Report",
      description: `Generating a summary of activity in <#${interaction.channel.id}> over the last ${hourLimit} hour(s) and sending to requestor via DM (this make take 5-10 seconds).\n\nWant a copy of this report, too? Click the 📩  below to have one sent to your DMs.`,
    });

    try {
      await interaction.reply({ embeds: [embed] });
      const notice = (await interaction.fetchReply()) as Message;
      await notice.react("📩");
      return notice.id;
    } catch (err) {
      console.error("Failed to create notice in channel.");
    }
  };

  public async handleReportRequest(interaction: CommandInteraction) {
    const { options } = interaction;
    const hourLimit = options.getInteger("duration", true);

    if (hourLimit > 24) {
      return await interaction.reply({
        content:
          "In order to maintain order, please limit summary reports to last 24 hours",
        ephemeral: true,
      });
    }

    if (interaction.channel.type !== "GUILD_TEXT") {
      return await interaction.reply({
        content:
          "My summary method doesn't work great over DM. Please call me in a text channel.",
      });
    }

    const noticeId = await this.sendChannelReportNotice(interaction, hourLimit);

    try {
      const reportId = await this.generateReport(
        interaction.channel,
        hourLimit,
        noticeId
      );

      this.sendReport(interaction.user, reportId);
    } catch (err) {
      console.log(err);
    }
  }

  public handleSendRequest(user: User, messageId: string) {
    const reportId = this.getReportId(messageId);
    this.sendReport(user, reportId);
  }

  public async sendReport(user: User, reportId: string) {
    try {
      const dmChannel = await user.createDM();
      const reply = this.buildReportEmbeds(reportId);
      dmChannel.send(
        reply || {
          content:
            "No report with that id. We don't store them forever, so try generating a new one from the channel.",
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  private async fetchMessages(channel: TextChannel, hourLimit: number) {
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
        const response = await channel.messages.fetch(options);
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

    this.collections[channel.id] = messages;
  }

  public getReportId(noticeId: string) {
    return this.notices[noticeId];
  }

  public buildReportEmbeds(id: string) {
    const report = this.reports[id];
    return report ? { embeds: Object.values(report) } : null;
  }

  public async generateReport(
    channel: TextChannel,
    hourLimit: number = 8,
    noticeId: string
  ): Promise<string> {
    const reportId = uuidv4();
    this.reports[reportId] = {};
    const report = this.reports[reportId];
    const channelId = channel.id;
    this.notices[noticeId] = reportId;

    // Ensures adaquate message collection size has been fetched to generate report from
    try {
      await this.fetchMessages(channel, hourLimit);
    } catch (err) {
      throw err;
    }

    const collection = this.collections[channel.id];

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
