import { Providers } from "../../../providers";
import { generateNotificationEmbed } from "../../ndb2/actions/embedGenerators/generateNotificationEmbed";
import fetchGuild from "../../../helpers/fetchGuild";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { API } from "../../../providers/db/models/types";

export default function NDBBetClosedNotifications({
  models,
  ndb2Bot,
  notifications,
}: Providers) {
  notifications.on("ndb_bet_closed", async (prediction, messageLink) => {
    const logger = new Logger(
      "New Notification Event",
      LogInitiator.NDB2,
      "ndb_bet_closed"
    );

    const embed = generateNotificationEmbed({
      type: "ndb_bet_closed",
      text: prediction.text,
      messageLink,
      predictionId: prediction.id,
    });

    const guild = fetchGuild(ndb2Bot);

    let subscribers: API.UserNotification.FetchBetClosedSubscribers[];

    try {
      subscribers = await models.userNotifications.fetchBetClosedSubscribers();
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
