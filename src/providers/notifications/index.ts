import {
  Collection,
  Guild,
  GuildMember,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessageCreateOptions,
  MessagePayload,
  ThreadChannel,
} from "discord.js";
import { EventWindow } from "../../actions/monitor-events";
import { TypedEventEmitter } from "../../utils/TypedEventEmitter";
import { NDB2API } from "../ndb2-client";

// All Notifiable Events and their params are defined here.
type IMCNotificationEvent = {
  events_new: [event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>];
  events_pre: [eventWindow: EventWindow];
  event_forum_post: [
    event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
    thread: ThreadChannel
  ];
  ndb_new: [prediction: NDB2API.EnhancedPrediction, messageLink: string];
  ndb_prediction_closed: [
    prediction: NDB2API.EnhancedPrediction,
    messageLink: string
  ];
  ndb_bet_closed: [prediction: NDB2API.EnhancedPrediction, messageLink: string];
  ndb_bet_retired: [
    prediction: NDB2API.EnhancedPrediction,
    messageLink: string
  ];
  ndb_prediction_judged: [
    prediction: NDB2API.EnhancedPrediction,
    messageLink: string
  ];
  ndb_bet_judged: [prediction: NDB2API.EnhancedPrediction, messageLink: string];
  ndb_season_end: [NDB2API.Season, messageLink: string];
};

export class NotificationsProvider extends TypedEventEmitter<IMCNotificationEvent> {
  constructor() {
    super();
  }

  public async queueDMs(
    guild: Guild,
    discordIds: string | string[],
    content: string | MessageCreateOptions | MessagePayload
  ) {
    const ids = typeof discordIds === "string" ? [discordIds] : discordIds;

    let subscribers: Collection<string, GuildMember>;

    try {
      subscribers = await guild.members.fetch({ user: ids });
    } catch (err) {
      console.error(err);
      return;
    }

    subscribers.forEach(async (subscriber) => {
      try {
        const dmChannel = await subscriber.createDM();
        await dmChannel.send(content);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public async queueThreadAdd(
    thread: ThreadChannel,
    discordIds: string | string[]
  ) {
    // add users to thread
    for (const subscriber of discordIds) {
      try {
        await thread.members.add(subscriber);
      } catch (err) {
        console.error(err);
      }
    }
  }
}

const notifications = new NotificationsProvider();
export default notifications;
