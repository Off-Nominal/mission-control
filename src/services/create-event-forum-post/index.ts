import {
  Client,
  ForumChannel,
  Guild,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MediaChannel,
} from "discord.js";
import { Providers } from "../../providers";
import { monitorEvents } from "../../actions/monitor-events";
import { parseCommands } from "../../helpers/parseCommands";
import fetchGuild from "../../helpers/fetchGuild";
import {
  createForumPost,
  doesWindowMatch,
  fetchExistingPost,
  getType,
  updateForumPostForEvent,
} from "./helpers";
import { ContentListener } from "../../providers/rss-providers/ContentListener";

const handleForumPostRequest = async (
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  channel: ForumChannel | MediaChannel,
  rssProvider: ContentListener
) => {
  const existingPost = await fetchExistingPost(event, channel);

  if (existingPost) {
    updateForumPostForEvent(event, existingPost, event.url);
  } else {
    const type = getType(event, rssProvider);
    createForumPost(event, channel, type);
  }
};

const getLivechatForumChannel = async (
  client: Client,
  id: string
): Promise<ForumChannel | MediaChannel> => {
  const channel = await client.channels.cache.get(id);
  if (!channel || !channel.isThreadOnly()) {
    throw new Error(
      "Livechat Forum Channel could not be found or is not a thread-only channel. This should happen."
    );
  }
  return channel;
};

export default function CreateEventForumPost({
  eventsBot,
  helperBot,
  mcconfig,
  rssProviders,
}: Providers) {
  eventsBot.once("clientReady", async () => {
    // fill cache with active threads and a subset of archived threads
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

  monitorEvents(eventsBot, async (eventWindow) => {
    const channel = await getLivechatForumChannel(
      eventsBot,
      mcconfig.discord.channels.livechat
    );

    const windowMatches = doesWindowMatch(eventWindow);

    if (!windowMatches) {
      return;
    }

    handleForumPostRequest(eventWindow.event, channel, rssProviders.yt);
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

    handleForumPostRequest(event, channel, rssProviders.yt);
  });
}
