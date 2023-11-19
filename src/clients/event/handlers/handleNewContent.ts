import { ChannelType, Client } from "discord.js";
import { ContentFeedItem } from "../../../actions/post-to-content-channel";
import createDiscordEvent from "../actions/createDiscordEvent";
import createEventAnnouncementEmbed from "../actions/createEventAnnouncementEmbed";
import fetchYouTubeVideo from "../actions/fetchYouTubeVideo";
import generateEventDetailsFromYouTube from "../actions/generateEventDetailsFromYouTube";
import mcconfig from "../../../mcconfig";

export default async function handleNewContent(
  content: ContentFeedItem,
  client: Client
) {
  try {
    const [video] = await fetchYouTubeVideo(content.id);
    const { liveStreamingDetails } = video;

    // do nothing if this video is not a livestream or if the livestream has ended
    if (!liveStreamingDetails || liveStreamingDetails.actualEndTime) {
      return;
    }
    const eventDetails = generateEventDetailsFromYouTube(video);
    const event = await createDiscordEvent(eventDetails, client);
    const embed = createEventAnnouncementEmbed(event, "new");
    const channel = await client.channels.fetch(
      mcconfig.discord.channels.announcements
    );
    if (channel.type !== ChannelType.GuildAnnouncement) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}
