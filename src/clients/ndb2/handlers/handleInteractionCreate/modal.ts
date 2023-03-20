import { CacheType, Interaction } from "discord.js";
import { Ndb2Events } from "../../../../types/eventEnums";
import { LogInitiator } from "../../../../types/logEnums";
import { Logger, LogStatus } from "../../../../utilities/logger";

export const handleModalInteraction = (interaction: Interaction<CacheType>) => {
  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    "NDB2 Modal Interaction Handler"
  );

  logger.addLog(
    LogStatus.INFO,
    `Interaction is a Modal Submit - handing off to NEW_PREDICTION handler.`
  );
  logger.sendLog(interaction.client);
  return interaction.client.emit(Ndb2Events.NEW_PREDICTION, interaction);
};
