import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import {
  PredictionLifeCycle,
  SearchOptions,
  SortByOption,
} from "../../../providers/ndb2-client";
import { generateListPredictionsEmbed } from "../actions/embedGenerators/generateListPredictionsEmbed";

export default function ViewPredictions({ ndb2Client, ndb2Bot }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "list") {
      return;
    }

    const listType = options.getString("type", true);

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      `List Predictions: ${listType}`
    );

    if (
      listType !== "recent" &&
      listType !== "upcoming" &&
      listType !== "upcoming-mine" &&
      listType !== "upcoming-no-bet"
    ) {
      logger.addLog(
        LogStatus.FAILURE,
        `Invalid interaction option: Type: ${listType}`
      );
      interaction.reply({
        content:
          "This is an invalid option. Type can only be 'recent' or 'upcoming'",
      });
      return;
    }

    const searchOptions: SearchOptions = {};

    if (listType === "recent") {
      searchOptions.sort_by = [SortByOption.CREATED_DESC];
      searchOptions.status = [PredictionLifeCycle.OPEN];
    }

    if (listType === "upcoming") {
      searchOptions.sort_by = [SortByOption.DUE_ASC];
      searchOptions.status = [PredictionLifeCycle.OPEN];
    }

    if (listType === "upcoming-mine") {
      searchOptions.sort_by = [SortByOption.DUE_ASC];
      searchOptions.status = [PredictionLifeCycle.OPEN];
      searchOptions.creator = interaction.user.id;
    }

    if (listType === "upcoming-no-bet") {
      searchOptions.sort_by = [SortByOption.DUE_ASC];
      searchOptions.status = [PredictionLifeCycle.OPEN];
      searchOptions.unbetter = interaction.user.id;
    }

    try {
      const response = await ndb2Client.searchPredictions(searchOptions);
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully fetched predictions from API."
      );

      const predictions = response.data;

      const embed = generateListPredictionsEmbed(listType, predictions);

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
