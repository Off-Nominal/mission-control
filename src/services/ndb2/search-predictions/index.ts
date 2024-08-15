import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { SearchOptions } from "../../../providers/ndb2-client";
import { generateListPredictionsEmbed } from "../actions/embedGenerators/generateListPredictionsEmbed";

export default function SearchPredictions({ ndb2Client, ndb2Bot }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "search") {
      return;
    }

    const keyword = options.getString("keyword", true);

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      `Search Predictions: Keyword - ${keyword}`,
      interaction.client
    );

    const searchOptions: SearchOptions = {
      keyword,
    };

    try {
      const response = await ndb2Client.searchPredictions(searchOptions);
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully fetched predictions from API."
      );

      const predictions = response.data;

      const embed = generateListPredictionsEmbed("search", predictions, {
        keyword,
      });

      const actionRow = new ActionRowBuilder<ButtonBuilder>();
      actionRow.addComponents(
        new ButtonBuilder()
          .setLabel("Advanced Search on Web")
          .setURL("https://ndb.offnom.com/predictions")
          .setStyle(ButtonStyle.Link)
      );

      await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully posted prediction list embed to Discord"
      );
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to fetch predictions from API");
    }

    logger.sendLog(interaction.client);
  });
}
