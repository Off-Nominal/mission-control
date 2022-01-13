import { Client } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";
import fetchTextChannel from "../../actions/fetchChannel";
import createDiscordEvent from "../actions/createDiscordEvent";
import createEventAnnouncementEmbed from "../actions/createEventAnnouncementEmbed";
import fetchYouTubeVideo from "../actions/fetchYouTubeVideo";

const ANNOUNCEMENTS_CHANNEL_ID = process.env.ANNOUNCEMENTSCHANNELID;
const offnomThumb =
  "https://res.cloudinary.com/dj5enq03a/image/upload/v1642095232/Discord%20Assets/offnominal_2021-01_w4buun.png";

export default async function handleNewContent(
  newContent: {
    feed: string;
    content: FeedItem;
  },
  client: Client
) {
  try {
    const [video] = await fetchYouTubeVideo(newContent.content.id);
    const { liveStreamingDetails } = video;

    // do nothing if this video is not a livestream or if the livestream has ended
    if (!liveStreamingDetails || liveStreamingDetails.actualEndTime) {
      return;
    }

    const event = await createDiscordEvent(video, client);
    const embed = createEventAnnouncementEmbed(event, offnomThumb);
    const channel = await fetchTextChannel(client, ANNOUNCEMENTS_CHANNEL_ID);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}
