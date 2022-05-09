import { v4 as uuidv4 } from "uuid";
import {
  Collection,
  CommandInteraction,
  Message,
  MessageEmbed,
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
import { fetchMessagesInLast } from "../helpers/fetchMessagesInLast";

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
    const hourLimit = interaction.options.getInteger("duration", true);

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

    try {
      const noticeId = await this.sendChannelReportNotice(
        interaction,
        hourLimit
      );
      const reportId = await this.generateReport(
        interaction.channel,
        hourLimit,
        noticeId
      );

      this.sendReport(interaction.user, reportId);
    } catch (err) {
      console.error(err);
    }
  }

  public handleSendRequest(user: User, messageId: string) {
    const reportId = this.getReportId(messageId);
    this.sendReport(user, reportId);
  }

  public async sendReport(user: User, reportId: string) {
    const report = this.reports[reportId];
    const dmChannel = await user.createDM();

    if (!report) {
      return dmChannel.send({
        content:
          "No report by that ID. We don't store them forever, so try generating a new one in the channel!",
      });
    }

    try {
      const embeds = Object.values(report);
      dmChannel.send({
        embeds,
      });
    } catch (err) {
      console.error(err);
    }
  }

  public getReportId(noticeId: string) {
    return this.notices[noticeId];
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
      this.collections[channel.id] = await fetchMessagesInLast(
        channel,
        hourLimit
      );
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
