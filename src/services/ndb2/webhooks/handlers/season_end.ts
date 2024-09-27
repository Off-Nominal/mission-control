import { channelMention, Client, Guild } from "discord.js";
import { LogStatus } from "../../../../logger/Logger";
import { NDB2API, Ndb2Client } from "../../../../providers/ndb2-client";
import { generateInteractionReplyFromTemplate } from "../../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../../actions/embedGenerators/templates/helpers/types";
import mcconfig from "../../../../mcconfig";
import { generateSender } from "../helpers";
import { loggerContext } from "../contexts";

export const handleSeasonEnd = async (options: {
  ndb2Client: Ndb2Client;
  client: Client;
  guild: Guild;
  results: NDB2API.SeasonResults;
}) => {
  const logger = loggerContext.getStore();

  logger.addLog(
    LogStatus.INFO,
    "Event was SEASON END, generating embed notice."
  );

  let predictionsLeaderboard: NDB2API.PredictionsLeader[] = [];
  let betsLeaderboard: NDB2API.BetsLeader[] = [];
  let pointsLeaderboard: NDB2API.PointsLeader[] = [];

  try {
    const promises: [
      Promise<NDB2API.GetPredictionsLeaderboard>,
      Promise<NDB2API.GetBetsLeaderboard>,
      Promise<NDB2API.GetPointsLeaderboard>
    ] = [
      options.ndb2Client.getPredictionsLeaderboard(options.results.season.id),
      options.ndb2Client.getBetsLeaderboard(options.results.season.id),
      options.ndb2Client.getPointsLeaderboard(options.results.season.id),
    ];
    await Promise.all(promises).then((leaderboards) => {
      predictionsLeaderboard = leaderboards[0].data.leaders;
      betsLeaderboard = leaderboards[1].data.leaders;
      pointsLeaderboard = leaderboards[2].data.leaders;
    });
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Leaderboard fetch failed");
    logger.sendLog(options.client);
    return console.error(err);
  }

  const [embeds, components] = generateInteractionReplyFromTemplate(
    NDB2EmbedTemplate.View.SEASON_END,
    {
      results: options.results,
      predictionsLeaderboard,
      betsLeaderboard,
      pointsLeaderboard,
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
        `Season End Notice sent successfully to ${channelMention(
          generalChannel.id
        )}`
      );
      logger.sendLog(options.client);
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, `Failed to send Season End Notice.`);
      logger.sendLog(options.client);
    });
};
