import { userMention } from "@discordjs/builders";
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
import { channelIds } from "../../../types/channelEnums";
import { add } from "date-fns";
import { generatePublicNotice } from "./generatePublicNotice";

const fallbackContextChannelId = channelIds.general;

export enum NoticeType {
  RETIRED = "retired",
  TRIGGERED = "triggered",
}

const getLoggerFields = (
  type: NoticeType,
  triggerer_id: string
): [string, string] => {
  if (type === NoticeType.RETIRED) {
    return ["Retirement Notice", "Prediction retired"];
  }

  if (type === NoticeType.TRIGGERED) {
    return [
      "Trigger Notice",
      `Prediction triggered ${triggerer_id ? "manually" : "automatically"} by ${
        triggerer_id ? `user ${userMention(triggerer_id)}` : "NDB2"
      }`,
    ];
  }
};

export const sendPublicNotice = async (
  client: Client,
  subs: Ndb2MsgSubscription[],
  predictor: GuildMember,
  db: DbClient,
  prediction: NDB2API.EnhancedPrediction,
  type: NoticeType
) => {
  const { addSubscription, fetchSubByType } = ndb2MsgSubscriptionQueries(db);

  const [loggerTitle, loggerMessage] = getLoggerFields(
    type,
    prediction.triggerer?.discord_id
  );

  const logger = new Logger(loggerTitle, LogInitiator.NDB2, loggerMessage);

  const guild = fetchGuild(client);

  const triggerer: Promise<GuildMember | null> = prediction.triggerer
    ? guild.members
        .fetch(prediction.triggerer.discord_id)
        .then((triggerer) => {
          logger.addLog(
            LogStatus.SUCCESS,
            "Triggerer Discord profile successfully fetched"
          );
          return triggerer;
        })
        .catch((err) => {
          console.error(err);
          logger.addLog(
            LogStatus.FAILURE,
            `Failed to fetch triggerer from Discord, cannot post notice.`
          );
          throw err;
        })
    : Promise.resolve(null);

  let channelId: string;
  let context: Promise<Ndb2MsgSubscription[]>;

  // Retired predictions post notice in the channel they are retired
  if (type === NoticeType.RETIRED) {
    context = fetchSubByType(prediction.id, Ndb2MsgSubscriptionType.RETIREMENT);
  } else {
    context = fetchSubByType(prediction.id, Ndb2MsgSubscriptionType.CONTEXT);
  }

  const channel = context.then(([contextSub]) => {
    if (!contextSub) {
      logger.addLog(
        LogStatus.FAILURE,
        `No context subscription found, using fallback`
      );
      channelId = fallbackContextChannelId;
    } else {
      channelId = contextSub.channel_id;
    }
    return guild.channels.fetch(channelId);
  });

  Promise.all([predictor, channel, triggerer])
    .then(([predictor, channel, triggerer]) => {
      if (!channel.isTextBased()) {
        throw new Error("Context channel is not text based");
      }

      const response = generatePublicNotice(
        prediction,
        type,
        prediction.bets.map((bet) => bet.better.discord_id),
        predictor,
        triggerer,
        client
      );

      return channel
        .send(response)
        .then((message) => {
          if (type === NoticeType.TRIGGERED) {
            addSubscription(
              Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
              prediction.id,
              message.channel.id,
              message.id,
              add(new Date(), { hours: 36 })
            );
          }
        })
        .then(() => {
          logger.addLog(
            LogStatus.SUCCESS,
            "Sucessfully logged subscription for notice"
          );
        })
        .catch((err) => {
          console.error(err);
          logger.addLog(
            LogStatus.FAILURE,
            `Could not log subscription to vote notice.`
          );
        });
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, `Could not send public notice.`);
    })
    .finally(() => {
      return logger.sendLog(client);
    });
};
