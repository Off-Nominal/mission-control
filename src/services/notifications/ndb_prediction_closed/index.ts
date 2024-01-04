import { Providers } from "../../../providers";
import { generateNotificationEmbed } from "../../ndb2/actions/embedGenerators/generateNotificationEmbed";
import fetchGuild from "../../../helpers/fetchGuild";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";

export default function NDBPredictionClosedNotifications({
  models,
  ndb2Bot,
  notifications,
}: Providers) {
  notifications.on("ndb_prediction_closed", async (prediction, messageLink) => {
    const logger = new Logger(
      "New Notification Event",
      LogInitiator.NDB2,
      "ndb_prediction_closed"
    );

    try {
      const isSubscribed =
        await models.userNotifications.fetchIsOwnPredictionClosedSubscribed(
          prediction.predictor.discord_id
        );
      logger.addLog(
        LogStatus.SUCCESS,
        `Subscription determination made (${isSubscribed})`
      );
      if (!isSubscribed) {
        return;
      }
    } catch (err) {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, "Failed to determine subscription");
      return;
    }

    const embed = generateNotificationEmbed({
      type: "ndb_prediction_closed",
      text: prediction.text,
      messageLink,
      predictionId: prediction.id,
    });

    const guild = fetchGuild(ndb2Bot);

    try {
      await notifications.queueDMs(guild, prediction.predictor.discord_id, {
        embeds: [embed],
      });
      logger.addLog(LogStatus.SUCCESS, `Subscriber notification queued`);
    } catch (err) {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, "Failed to send Notification");
    }

    logger.sendLog(ndb2Bot);
  });
}
