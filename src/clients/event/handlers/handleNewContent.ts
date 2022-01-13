import { Client } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";
import createDiscordEvent from "../actions/createDiscordEvent";

import fetchYouTubeVideo from "../actions/fetchYouTubeVideo";

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

    await createDiscordEvent(video, client);
  } catch (err) {
    console.error(err);
  }
}
