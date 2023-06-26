import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
} from "discord.js";
import { Client } from "pg";
import { LogStatus, Logger } from "../../../utilities/logger";
import { LogInitiator } from "../../../types/logEnums";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { generateScoresEmbed } from "../actions/embedGenerators/generateScoresEmbed";
import fetchGuild from "../../../utilities/fetchGuild";

export default function generateHandleViewScore(db: Client) {
  return async function handleVewScore(
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "View Score"
    );

    const { options } = interaction;
    const brag = options.getBoolean("brag");
    const window = options.getString("window") || "current";
    let seasonIdentifier: undefined | "current" | "last";

    if (window === "current") {
      seasonIdentifier = "current";
    }

    if (window === "last") {
      seasonIdentifier = "last";
    }

    // Score calculcations can sometimes take time, this deferred reply let's discord know we're working on it!
    try {
      await interaction.deferReply({ ephemeral: !brag });
      logger.addLog(LogStatus.SUCCESS, "Successfully deferred reply.");
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to defer reply, aborting.");
      return logger.sendLog(interaction.client);
    }

    const discord_id = interaction.user.id;

    try {
      const response = await ndb2Client.getScores(discord_id, seasonIdentifier);
      logger.addLog(LogStatus.SUCCESS, "Successfully fetched scores from API.");

      const scores = response.data;
      const guild = fetchGuild(interaction.client);
      const member = await guild.members.fetch(interaction.user.id);
      logger.addLog(LogStatus.SUCCESS, "Successfully fetched Guild Member");

      const embed = generateScoresEmbed(scores, member, seasonIdentifier);

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
        "Successfully posted scores embed to Discord"
      );
    } catch (err) {
      await interaction.editReply({
        content: "There was an error fetching scores from the API.",
      });
      logger.addLog(LogStatus.FAILURE, "Failed to fetch scores from API");
    }

    logger.sendLog(interaction.client);
  };
}
