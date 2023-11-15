import { CacheType, Interaction } from "discord.js";
import { Logger, LogInitiator, LogStatus } from "../../../../services/logger";
import { Ndb2Events } from "../../../../discord_clients/ndb2";

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
