import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
} from "discord.js";
import { LogStatus, Logger } from "../../../utilities/logger";
import { LogInitiator } from "../../../types/logEnums";
import { SearchOptions, ndb2Client } from "../../../utilities/ndb2Client";
import { generateListPredictionsEmbed } from "../actions/embedGenerators/generateListPredictionsEmbed";

export default async function handleSearchPredictions(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const { options } = interaction;
  const keyword = options.getString("keyword", true);

  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    `Search Predictions: Keyword - ${keyword}`
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
}
