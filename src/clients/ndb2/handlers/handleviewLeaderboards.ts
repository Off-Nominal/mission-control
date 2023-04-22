import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { Client } from "pg";
import { LogStatus, Logger } from "../../../utilities/logger";
import { LogInitiator } from "../../../types/logEnums";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { generateListPredictionsEmbed } from "../actions/embedGenerators/generateListPredictionsEmbed";
import { generateLeaderboardEmbed } from "../actions/embedGenerators/generateLeaderboardEmbed";

export default function generateHandleViewLeaderboards(db: Client) {
  return async function handleViewLeaderboards(
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    const { options } = interaction;
    const leaderboardType = options.getString("type", true);

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      `View Leaderboards: ${leaderboardType}`
    );

    if (
      leaderboardType !== "points" &&
      leaderboardType !== "bets" &&
      leaderboardType !== "predictions"
    ) {
      logger.addLog(
        LogStatus.FAILURE,
        `Invalid interaction option: Type: ${leaderboardType}`
      );
      return interaction.reply({
        content:
          "This is an invalid option. Type can only be 'points', 'predictions' or 'bets'",
      });
    }

    try {
      const response = await ndb2Client.getLeaderboard(leaderboardType);
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully fetched leaderboard from API."
      );

      const leaders = response.data.leaders;

      const embed = generateLeaderboardEmbed(leaderboardType, leaders);
      await interaction.reply({ embeds: [embed] });
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully posted leaderboard embed to Discord"
      );
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to fetch leaderboard from API");
    }

    logger.sendLog(interaction.client);
  };
}
