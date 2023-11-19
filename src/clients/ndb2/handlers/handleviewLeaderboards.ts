import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  LogStatus,
  LogInitiator,
  Logger,
} from "../../../services/logger/Logger";
import { generateLeaderboardEmbed } from "../actions/embedGenerators/generateLeaderboardEmbed";
import ndb2Client, { NDB2API } from "../../../providers/ndb2-client";

export default async function handleViewLeaderboards(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const { options } = interaction;
  const leaderboardType = options.getString("type", true);
  const brag = options.getBoolean("brag");
  const window = options.getString("window") || "current";
  let seasonIdentifier: undefined | "current" | "last";

  if (window === "current") {
    seasonIdentifier = "current";
  }

  if (window === "last") {
    seasonIdentifier = "last";
  }

  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    `View Leaderboards: ${leaderboardType}`
  );

  // Leaderboard calculcations can sometimes take time, this deferred reply let's discord know we're working on it!
  try {
    await interaction.deferReply({ ephemeral: !brag });
    logger.addLog(LogStatus.SUCCESS, "Successfully deferred reply.");
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Failed to defer reply, aborting.");
    return logger.sendLog(interaction.client);
  }

  if (
    leaderboardType !== "points" &&
    leaderboardType !== "bets" &&
    leaderboardType !== "predictions"
  ) {
    logger.addLog(
      LogStatus.FAILURE,
      `Invalid interaction option: Type: ${leaderboardType}`
    );
    return interaction.editReply({
      content:
        "This is an invalid option. Type can only be 'points', 'predictions' or 'bets'",
    });
  }

  try {
    let response:
      | NDB2API.GetPredictionsLeaderboard
      | NDB2API.GetBetsLeaderboard
      | NDB2API.GetPointsLeaderboard;

    if (leaderboardType === "predictions") {
      response = await ndb2Client.getPredictionsLeaderboard(seasonIdentifier);
    } else if (leaderboardType === "bets") {
      response = await ndb2Client.getBetsLeaderboard(seasonIdentifier);
    } else {
      response = await ndb2Client.getPointsLeaderboard(seasonIdentifier);
    }

    logger.addLog(
      LogStatus.SUCCESS,
      "Successfully fetched leaderboard from API."
    );

    const leaders = response.data.leaders;

    const embed = generateLeaderboardEmbed(
      leaderboardType,
      leaders,
      seasonIdentifier
    );

    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    actionRow.addComponents(
      new ButtonBuilder()
        .setLabel("View Leaderboards on Web")
        .setURL("https://ndb.offnom.com/")
        .setStyle(ButtonStyle.Link)
    );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });
    logger.addLog(
      LogStatus.SUCCESS,
      "Successfully posted leaderboard embed to Discord"
    );
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Failed to fetch leaderboard from API");
  }

  logger.sendLog(interaction.client);
}
