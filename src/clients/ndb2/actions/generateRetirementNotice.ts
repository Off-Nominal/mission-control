import {
  EmbedBuilder,
  time,
  TimestampStyles,
  userMention,
} from "@discordjs/builders";
import { Client as DbClient } from "pg";
import { Client, GuildMember } from "discord.js";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscription,
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { LogInitiator } from "../../../types/logEnums";
import fetchGuild from "../../../utilities/fetchGuild";
import { Logger, LogStatus } from "../../../utilities/logger";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { isFulfilled } from "../../../helpers/allSettledTypeGuard";
import { channelIds } from "../../../types/channelEnums";

const fallbackContextChannelId = channelIds.general;

export const generateRetirementNotice = async (
  client: Client,
  db: DbClient,
  prediction: NDB2API.EnhancedPrediction
) => {
  const { fetchSubs } = ndb2MsgSubscriptionQueries(db);

  const logger = new Logger(
    "Retirement Notice",
    LogInitiator.NDB2,
    "Prediction retired"
  );

  const guild = fetchGuild(client);

  const predictor = guild.members
    .fetch(prediction.predictor.discord_id)
    .then((predictor) => {
      logger.addLog(
        LogStatus.SUCCESS,
        "Predictor Discord profile successfully fetched"
      );
      return predictor;
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch predictor from Discord, cannot post notice.`
      );
      throw err;
    });

  const channel = fetchSubs(prediction.id)
    .then((subs) => {
      logger.addLog(
        LogStatus.INFO,
        `Fetched ${subs.length} message subscriptions to update.`
      );
      return subs;
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch message subscriptions from database.`
      );
      throw err;
    })
    .then((subs) => {
      let context: Ndb2MsgSubscription;

      context = subs.find(
        (sub) => sub.type === Ndb2MsgSubscriptionType.RETIREMENT
      );
      if (!context) {
        context = subs.find(
          (sub) => sub.type === Ndb2MsgSubscriptionType.CONTEXT
        );
      }
      if (!context) {
        logger.addLog(
          LogStatus.FAILURE,
          `No context subscription found, using fallback`
        );
        return fallbackContextChannelId;
      } else {
        return context;
      }
    })
    .then((context) => {
      if (typeof context === "string") {
        return guild.channels.fetch(context);
      }
      return guild.channels.fetch(context.channel_id);
    });

  const betters: Promise<GuildMember>[] = [];

  for (const bet of prediction.bets) {
    betters.push(
      guild.members.fetch(bet.better.discord_id).catch((err) => {
        logger.addLog(
          LogStatus.FAILURE,
          `Could not fetch better data for discord Id ${userMention(
            bet.better.discord_id
          )}`
        );
        throw err;
      })
    );
  }

  Promise.all([predictor, channel, Promise.allSettled(betters)])
    .then(([predictor, channel, betters]) => {
      if (!channel.isTextBased()) {
        throw new Error("Context channel is not text based");
      }

      const fetchedBetters = betters.filter(isFulfilled).map((p) => p.value);

      const content =
        "Notice to affected parties who have bets on this prediction: " +
        fetchedBetters.map((b) => userMention(b.id)).join(", ");

      const created = new Date(prediction.created_date);
      const retired = new Date(prediction.retired_date);

      const embed = new EmbedBuilder({
        author: {
          name: predictor.displayName,
          icon_url: predictor.displayAvatarURL(),
        },
        thumbnail: {
          url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1679241808/Discord%20Assets/5267928_bsb9z6.png",
        },
        title: "Public Notice",
        description: `Prediction #${
          prediction.id
        } has been retired by ${userMention(
          predictor.id
        )} within the allowable adjustment period since the prediction was made.`,
        fields: [
          {
            name: "Original text",
            value: prediction.text,
          },
          {
            name: `Created`,
            value: `🗓️ ${time(created, TimestampStyles.LongDate)} (${time(
              created,
              TimestampStyles.RelativeTime
            )})`,
          },
          {
            name: "Retired",
            value: `🗓️ ${time(retired, TimestampStyles.LongDate)} (${time(
              retired,
              TimestampStyles.RelativeTime
            )}) `,
          },
        ],
      });

      channel.send({ content, embeds: [embed] });
    })
    .catch((err) => {
      logger.addLog(LogStatus.FAILURE, `Could not send retirement notice.`);
    })
    .finally(() => {
      return logger.sendLog(client);
    });
};
