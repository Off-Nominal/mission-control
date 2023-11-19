import { ChannelType, Client } from "discord.js";
import fetchYouTubeVideo from "../../actions/fetch-youtube-video";
import {
  ContentFeedItem,
  postContent,
} from "../../actions/post-to-content-channel";
import { Providers } from "../../providers";
import { ContentListenerEvents } from "../../providers/rss-providers/ContentListener";
import { youtube_v3 } from "googleapis";
import generateEventDetailsFromYouTube from "./generateEventDetailsFromYouTube";
import createDiscordEvent from "../../actions/create-discord-event";
import createEventAnnouncementEmbed from "../../actions/create-event-announcement-embed";
import mcconfig from "../../mcconfig";

async function announceNewStream(
  content: ContentFeedItem,
  discordClient: Client,
  youtubeClient: youtube_v3.Youtube
) {
  try {
    const [video] = await fetchYouTubeVideo(youtubeClient, content.id);
    const { liveStreamingDetails } = video;

    // do nothing if this video is not a livestream or if the livestream has ended
    if (!liveStreamingDetails || liveStreamingDetails.actualEndTime) {
      return;
    }
    const eventDetails = generateEventDetailsFromYouTube(video);
    const event = await createDiscordEvent(eventDetails, discordClient);
    const embed = createEventAnnouncementEmbed(event, "new");
    const channel = await discordClient.channels.fetch(
      mcconfig.discord.channels.announcements
    );
    if (channel.type !== ChannelType.GuildAnnouncement) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}

export default function ContentPost({
  rssProviders,
  contentBot,
  eventsBot,
  youtube,
}: Providers) {
  // Podcast RSS Content
  rssProviders.wm.on(ContentListenerEvents.NEW, (content) => {
    // WeMartianas has a 10 minute delay to await site building
    setTimeout(() => {
      postContent(content, contentBot, "content");
    }, 600000);
  });

  rssProviders.meco.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  rssProviders.ofn.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  rssProviders.rpr.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  rssProviders.hl.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  // Youtube RSS Content
  rssProviders.yt.on(ContentListenerEvents.NEW, (content) => {
    announceNewStream(content, eventsBot, youtube);
  });

  rssProviders.hh.on(ContentListenerEvents.NEW, (content) => {
    announceNewStream(content, eventsBot, youtube);
  });
}
