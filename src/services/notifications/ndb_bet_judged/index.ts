import { Providers } from "../../../providers";
import { generateNotificationEmbed } from "../../ndb2/actions/embedGenerators/generateNotificationEmbed";
import fetchGuild from "../../../helpers/fetchGuild";
import { PredictionLifeCycle } from "../../../providers/ndb2-client";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { API } from "../../../providers/db/models/types";

export default function NDBBetJudgedNotifications({
  models,
  ndb2Bot,
  notifications,
}: Providers) {
  notifications.on("ndb_bet_judged", async (prediction, messageLink) => {
    if (
      prediction.status !== PredictionLifeCycle.SUCCESSFUL &&
      prediction.status !== PredictionLifeCycle.FAILED
    ) {
      return;
    }

    const logger = new Logger(
      "New Notification Event",
      LogInitiator.NDB2,
      "ndb_bet_judged"
    );
    const guild = fetchGuild(ndb2Bot);

    const embed = generateNotificationEmbed({
      type: "ndb_bet_judged",
      text: prediction.text,
      messageLink,
      predictionId: prediction.id,
      status: prediction.status,
    });

    let subscribers: API.UserNotification.FetchBetJudgedSubscribers[];

    try {
      subscribers = await models.userNotifications.fetchBetJudgedSubscribers();
      logger.addLog(
        LogStatus.SUCCESS,
        `${subscribers.length} Subscribers fetched`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, "Failed to fetch subscribers");
      return;
    }

    const usersToNotify: string[] = [];

    for (const subscriber of subscribers) {
      if (subscriber.discord_id === prediction.predictor.discord_id) {
        continue;
      }

      for (const bet of prediction.bets) {
        if (bet.better.discord_id === subscriber.discord_id) {
          usersToNotify.push(subscriber.discord_id);
        }
      }
    }

    try {
      await notifications.queueDMs(guild, usersToNotify, { embeds: [embed] });
      logger.addLog(
        LogStatus.SUCCESS,
        `${subscribers.length} Subscribers notifications queued`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, "Failed to send Notifications");
    }

    logger.sendLog(ndb2Bot);
  });
}
