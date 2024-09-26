import { channelMention, Client, Guild } from "discord.js";
import { LogStatus } from "../../../../logger/Logger";
import { NDB2API } from "../../../../providers/ndb2-client";
import { generateInteractionReplyFromTemplate } from "../../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../../actions/embedGenerators/templates/helpers/types";
import mcconfig from "../../../../mcconfig";
import { generateSender } from "../helpers";
import { loggerContext } from "../contexts";

export const handleSeasonStart = (options: {
  guild: Guild;
  client: Client;
  season: NDB2API.Season;
}) => {
  const logger = loggerContext.getStore();

  logger.addLog(
    LogStatus.INFO,
    "Event was SEASON START, generating embed notice."
  );

  const [embeds, components] = generateInteractionReplyFromTemplate(
    NDB2EmbedTemplate.View.SEASON_START,
    {
      season: options.season,
    }
  );

  const generalChannel = options.guild.channels.cache.get(
    mcconfig.discord.channels.general
  );
  if (!generalChannel) {
    logger.addLog(LogStatus.FAILURE, "General Channel Not found");
    return logger.sendLog(options.client);
  }

  const sendMessage = generateSender(options.guild);

  sendMessage(generalChannel.id, embeds, components)
    .then(() => {
      logger.addLog(
        LogStatus.SUCCESS,
        `Season Start Notice sent successfully to ${channelMention(
          generalChannel.id
        )}`
      );
      logger.sendLog(options.client);
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, `Failed to send Season Start Notice.`);
      logger.sendLog(options.client);
    });
};
