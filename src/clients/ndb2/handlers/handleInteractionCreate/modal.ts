import { CacheType, Interaction } from "discord.js";
import { Logger, LogInitiator, LogStatus } from "../../../../logger/Logger";
import { Ndb2Events } from "../../../../providers/ndb2-bot";

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
