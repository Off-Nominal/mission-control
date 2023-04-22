import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { Client } from "pg";
import { LogStatus, Logger } from "../../../utilities/logger";
import { LogInitiator } from "../../../types/logEnums";
import { SearchOptions, ndb2Client } from "../../../utilities/ndb2Client";
import { generateListPredictionsEmbed } from "../actions/embedGenerators/generateListPredictionsEmbed";

export default function generateHandleSearchPredictions(db: Client) {
  return async function handleSearchPredictions(
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
      await interaction.reply({ embeds: [embed], ephemeral: true });
      logger.addLog(
        LogStatus.SUCCESS,
        "Successfully posted prediction list embed to Discord"
      );
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, "Failed to fetch predictions from API");
    }

    logger.sendLog(interaction.client);
  };
}
