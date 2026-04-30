import { channelMention, Client, Guild } from "discord.js";
import { LogStatus } from "../../../../logger/Logger";
import { NDB2API, Ndb2Client } from "../../../../providers/ndb2-client";
import * as API_V2 from "@offnominal/ndb2-api-types/v2";
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
    "Event was SEASON END, generating embed notice.",
  );

  let predictionsLeaderboard: API_V2.Endpoints.Results.GET_seasons_BySeasonId.Data["results"] =
    [];
  let betsLeaderboard: API_V2.Endpoints.Results.GET_seasons_BySeasonId.Data["results"] =
    [];
  let pointsLeaderboard: API_V2.Endpoints.Results.GET_seasons_BySeasonId.Data["results"] =
    [];

  try {
    const promises: [
      Promise<API_V2.Endpoints.Results.GET_seasons_BySeasonId.Data>,
      Promise<API_V2.Endpoints.Results.GET_seasons_BySeasonId.Data>,
      Promise<API_V2.Endpoints.Results.GET_seasons_BySeasonId.Data>,
    ] = [
      options.ndb2Client.getResultsBySeasonId(options.results.season.id, {
        sort_by: "predictions_successful-desc",
        page: 1,
        per_page: 10,
      }),
      options.ndb2Client.getResultsBySeasonId(options.results.season.id, {
        sort_by: "bets_successful-desc",
        page: 1,
        per_page: 10,
      }),
      options.ndb2Client.getResultsBySeasonId(options.results.season.id, {
        sort_by: "points_net-desc",
        page: 1,
        per_page: 10,
      }),
    ];
    await Promise.all(promises).then((leaderboards) => {
      predictionsLeaderboard = leaderboards[0].results;
      betsLeaderboard = leaderboards[1].results;
      pointsLeaderboard = leaderboards[2].results;
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
    },
  );

  const generalChannel = options.guild.channels.cache.get(
    mcconfig.discord.channels.general,
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
          generalChannel.id,
        )}`,
      );
      logger.sendLog(options.client);
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, `Failed to send Season End Notice.`);
      logger.sendLog(options.client);
    });
};
