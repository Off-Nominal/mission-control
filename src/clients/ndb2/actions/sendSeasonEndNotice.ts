import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GuildTextBasedChannel,
} from "discord.js";
import fetchGuild from "../../../utilities/fetchGuild";
import {
  LogInitiator,
  LogStatus,
  Logger,
} from "../../../services/logger/Logger";
import { generateSeasonResultsEmbed } from "./embedGenerators/generateSeasonResultsEmbed";
import mcconfig from "../../../mcconfig";
import ndb2Client, { NDB2API } from "../../../providers/ndb2-client";

export const sendSeasonEndNotice = async (
  client: Client,
  results: NDB2API.SeasonResults
) => {
  const logger = new Logger(
    "New Season End Notice",
    LogInitiator.NDB2,
    "New season webhook received"
  );

  let predictionsLeaderboard: NDB2API.PredictionsLeader[];
  let betsLeaderboard: NDB2API.BetsLeader[];
  let pointsLeaderboard: NDB2API.PointsLeader[];

  try {
    const promises: [
      Promise<NDB2API.GetPredictionsLeaderboard>,
      Promise<NDB2API.GetBetsLeaderboard>,
      Promise<NDB2API.GetPointsLeaderboard>
    ] = [
      ndb2Client.getPredictionsLeaderboard(results.season.id),
      ndb2Client.getBetsLeaderboard(results.season.id),
      ndb2Client.getPointsLeaderboard(results.season.id),
    ];
    await Promise.all(promises).then((leaderboards) => {
      predictionsLeaderboard = leaderboards[0].data.leaders;
      betsLeaderboard = leaderboards[1].data.leaders;
      pointsLeaderboard = leaderboards[2].data.leaders;
    });
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Leaderboard fetch failed");
    logger.sendLog(client);
    return console.error(err);
  }

  const embed = generateSeasonResultsEmbed(
    results,
    predictionsLeaderboard,
    betsLeaderboard,
    pointsLeaderboard
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  actionRow.addComponents(
    new ButtonBuilder()
      .setLabel("View Leaderboards on Web")
      .setURL("https://ndb.offnom.com/")
      .setStyle(ButtonStyle.Link)
  );

  logger.addLog(LogStatus.SUCCESS, "Embed generated");

  const guild = fetchGuild(client);
  logger.addLog(LogStatus.SUCCESS, "Guild fetched");

  let channel: GuildTextBasedChannel;

  try {
    const channelResponse = await guild.channels.cache.get(
      mcconfig.discord.channels.general
    );
    if (!channelResponse.isTextBased()) {
      throw new Error("Not a text-based channel");
    } else {
      channel = channelResponse;
    }
    logger.addLog(LogStatus.SUCCESS, "Channel fetched");
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Channel fetch failed");
    logger.sendLog(client);
    return console.error(err);
  }

  try {
    await channel.send({ embeds: [embed], components: [actionRow] });
    logger.addLog(LogStatus.SUCCESS, "Embed sent");
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Embed send failed");
    logger.sendLog(client);
    return console.error(err);
  }

  logger.sendLog(client);
};
