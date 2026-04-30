import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import fetchGuild from "../../../helpers/fetchGuild";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { generateScoresEmbed } from "../actions/embedGenerators/templates/results";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";

export default function ViewScore({ ndb2Client, ndb2Bot }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "score") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Slash Command View Scores",
    );

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
      await interaction.deferReply(
        brag ? {} : { flags: MessageFlags.Ephemeral },
      );
      logger.addLog(LogStatus.SUCCESS, "Successfully deferred reply.");
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to defer reply, aborting.");
      logger.sendLog(interaction.client);
      return;
    }

    const discord_id = interaction.user.id;

    try {
      const results =
        seasonIdentifier !== undefined
          ? await ndb2Client.getSeasonResultBySeasonIdAndDiscordId(
              discord_id,
              seasonIdentifier,
            )
          : await ndb2Client.getAlltimeResultsByDiscordId(discord_id);
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully fetched results from API.",
      );
      const guild = fetchGuild(interaction.client);

      if (!guild) {
        throw new Error("No Guild found");
      }

      const member = await guild.members.fetch(interaction.user.id);
      logger.addLog(LogStatus.SUCCESS, "Successfully fetched Guild Member");

      const [embeds, components] = generateInteractionReplyFromTemplate(
        NDB2EmbedTemplate.View.RESULTS,
        {
          results,
          member,
          seasonIdentifier,
        },
      );
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully generated embeds and components",
      );

      await interaction.editReply({ embeds, components });
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully posted scores embed to Discord",
      );
    } catch (err) {
      await interaction.editReply({
        content: "There was an error fetching scores from the API.",
      });
      logger.addLog(LogStatus.FAILURE, "Failed to fetch scores from API");
    }

    logger.sendLog(interaction.client);
  });
}
