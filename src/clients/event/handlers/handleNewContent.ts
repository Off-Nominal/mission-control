import { Client } from "discord.js";
import { youtube_v3 } from "googleapis";
import { FeedItem } from "../../../listeners/feedListener/feedListener";
import createDiscordEvent from "../actions/createDiscordEvent";

import fetchYouTubeVideo from "../actions/fetchYouTubeVideo";

export default async function handleNewContent(
  newContent: {
    feed: string;
    content: FeedItem;
  },
  client: Client,
  timeout: number = 0
) {
  const youtubeVideoId = newContent.content.id;
  let video: youtube_v3.Schema$Video;

  try {
    const response = await fetchYouTubeVideo(youtubeVideoId);
    video = response[0];

    // do nothing if this video is not a livestream or if the livestream has ended
    if (
      !video.liveStreamingDetails ||
      video.liveStreamingDetails.actualEndTime
    ) {
      return;
    }

    await createDiscordEvent(video, client);
  } catch (err) {
    console.error(err);
  }
}
