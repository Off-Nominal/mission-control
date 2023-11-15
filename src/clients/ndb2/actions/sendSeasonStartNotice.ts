import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GuildTextBasedChannel,
} from "discord.js";
import fetchGuild from "../../../utilities/fetchGuild";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generateNewSeasonEmbed } from "./embedGenerators/generateNewSeasonEmbed";
import { LogInitiator } from "../../../types/logEnums";
import { LogStatus, Logger } from "../../../utilities/logger";
import mcconfig from "../../../mcconfig";

export const sendSeasonStartNotice = async (
  client: Client,
  season: NDB2API.Season
) => {
  const logger = new Logger(
    "New Season Start Notice",
    LogInitiator.NDB2,
    "New season webhook received"
  );

  const embed = generateNewSeasonEmbed(season);

  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  actionRow.addComponents(
    new ButtonBuilder()
      .setLabel("View Leaderboards on Web")
      .setURL("https://ndb.offnom.com/")
      .setStyle(ButtonStyle.Link)
  );

  logger.addLog(LogStatus.SUCCESS, "Embed generated");

  const guild = fetchGuild(client);
  logger.addLog(LogStatus.SUCCESS, "Guild fetched");

  let channel: GuildTextBasedChannel;

  try {
    const channelResponse = await guild.channels.cache.get(
      mcconfig.discord.channels.general
    );
    if (!channelResponse.isTextBased()) {
      throw new Error("Not a text-based channel");
    } else {
      channel = channelResponse;
    }
    logger.addLog(LogStatus.SUCCESS, "Channel fetched");
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Channel fetch failed");
    logger.sendLog(client);
    return console.error(err);
  }

  try {
    await channel.send({ embeds: [embed], components: [actionRow] });
    logger.addLog(LogStatus.SUCCESS, "Embed sent");
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Embed send failed");
    logger.sendLog(client);
    return console.error(err);
  }

  logger.sendLog(client);
};
