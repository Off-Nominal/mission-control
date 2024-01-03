import {
  ForumChannel,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MediaChannel,
  ThreadChannel,
} from "discord.js";
import { Providers } from "../../providers";
import { monitorEvents } from "../../actions/monitor-events";
import { parseCommands } from "../../helpers/parseCommands";
import fetchGuild from "../../helpers/fetchGuild";
import {
  createForumPost,
  doesWindowMatch,
  fetchExistingPost,
  getLivechatForumChannel,
  getType,
  updateForumPostForEvent,
} from "./helpers";
import { ContentListener } from "../../providers/rss-providers/ContentListener";
import { NotificationsProvider } from "../../providers/notifications";

export default function CreateEventForumPost({
  eventsBot,
  helperBot,
  mcconfig,
  models,
  rssProviders,
  notifications,
}: Providers) {
  // fill cache with active threads and a subset of archived threads
  eventsBot.once("ready", async () => {
    const channel = await getLivechatForumChannel(
      eventsBot,
      mcconfig.discord.channels.livechat
    );
    await channel.threads.fetchActive();
    await channel.threads.fetchArchived({
      fetchAll: true,
      limit: 100,
      type: "public",
    });
  });

  const handleForumPostRequest = async (
    event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
    channel: ForumChannel | MediaChannel,
    rssProvider: ContentListener,
    notificationsProvider: NotificationsProvider
  ) => {
    let thread: ThreadChannel | undefined = undefined;

    try {
      thread = await fetchExistingPost(event, channel);
      if (thread) {
        updateForumPostForEvent(event, thread, event.url);
      } else {
        const type = getType(event, rssProvider);
        thread = await createForumPost(event, channel, type);
      }
    } catch (err) {
      console.error(err);
    }

    if (!thread) {
      return;
    }

    notificationsProvider.emit("event_forum_post", event, thread);
  };

  monitorEvents(eventsBot, async (eventWindow) => {
    if (!doesWindowMatch(eventWindow)) {
      return;
    }

    const channel = await getLivechatForumChannel(
      eventsBot,
      mcconfig.discord.channels.livechat
    );

    handleForumPostRequest(
      eventWindow.event,
      channel,
      rssProviders.yt,
      notifications
    );
  });

  // dev helper to trigger new forum post
  helperBot.on("messageCreate", async (message) => {
    if (mcconfig.env !== "dev") {
      return;
    }

    const [prefix, eventId] = parseCommands(message);

    if (prefix !== "!eventforum") {
      return;
    }

    // fill cache
    const guild = fetchGuild(eventsBot);

    if (!guild) {
      return;
    }

    let event: GuildScheduledEvent | undefined = undefined;

    try {
      event = await guild.scheduledEvents?.fetch(eventId);
    } catch (err) {
      console.log(err);
    }

    if (event === undefined || !event.isScheduled()) {
      return;
    }

    const channel = await getLivechatForumChannel(
      eventsBot,
      mcconfig.discord.channels.livechat
    );

    handleForumPostRequest(event, channel, rssProviders.yt, notifications);
  });
}
