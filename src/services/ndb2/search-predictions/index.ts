import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { SearchOptions } from "../../../providers/ndb2-client";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";

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

      const [embeds, components] = generateInteractionReplyFromTemplate(
        NDB2EmbedTemplate.View.LIST,
        {
          type: "search",
          predictions,
          options: {
            keyword,
          },
        }
      );

      await interaction.reply({
        embeds,
        components,
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
