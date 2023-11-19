import { ChannelType, Client } from "discord.js";
import { ContentFeedItem } from "../../actions/post-to-content-channel";
import { Providers } from "../../providers";
import { ContentListenerEvents } from "../../providers/rss-providers/ContentListener";
import { youtube_v3 } from "googleapis";
import fetchYouTubeVideo from "../../actions/fetch-youtube-video";
import mcconfig from "../../mcconfig";
import generateEventDetailsFromYouTube from "./generateEventDetailsFromYouTube";
import createDiscordEvent from "../../actions/create-discord-event";
import createEventAnnouncementEmbed from "../../actions/create-event-announcement-embed";

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

export default function AnnounceStream({
  eventsBot,
  rssProviders,
  youtube,
}: Providers) {
  // Youtube RSS Content
  rssProviders.yt.on(ContentListenerEvents.NEW, (content) => {
    announceNewStream(content, eventsBot, youtube);
  });

  rssProviders.hh.on(ContentListenerEvents.NEW, (content) => {
    announceNewStream(content, eventsBot, youtube);
  });
}
