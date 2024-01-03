import { Providers } from "../../../providers";
import { generateNotificationEmbed } from "../../ndb2/actions/embedGenerators/generateNotificationEmbed";
import fetchGuild from "../../../helpers/fetchGuild";

export default function NewNDBPredictionNotifications({
  models,
  ndb2Bot,
  notifications,
}: Providers) {
  notifications.on("ndb_new", async (prediction, messageLink) => {
    const embed = generateNotificationEmbed({
      type: "ndb_new",
      text: prediction.text,
      messageLink,
      predictionId: prediction.id,
    });

    const subscribers =
      await models.userNotifications.fetchNewPredictionSubscribers({
        exclude: prediction.predictor.discord_id,
      });

    const guild = fetchGuild(ndb2Bot);

    notifications.queueDMs(
      guild,
      subscribers.map((subscriber) => subscriber.discord_id),
      { embeds: [embed] }
    );
  });
}
