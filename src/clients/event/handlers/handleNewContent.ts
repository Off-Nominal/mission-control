import { add } from "date-fns";
import { Client } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";
import fetchGuild from "../../actions/fetchGuild";
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
  let video;

  try {
    const response = await fetchYouTubeVideo(youtubeVideoId);
    video = response[0];
  } catch (err) {
    console.error(err);
  }

  // do nothing if this video is not a livestream or if the livestream has ended
  if (!video.liveStreamingDetails || video.liveStreamingDetails.actualEndTime) {
    return;
  }

  // Find the new Discord Event start time
  // If the stream has started, sets it for 30 seconds from now
  // Otherwise uses scheduled time from YouTube.
  const startTime = video.liveStreamingDetails.actualStartTime
    ? add(new Date(), { seconds: 30 })
    : video.liveStreamingDetails.scheduledStartTime;

  const guild = fetchGuild(client);
  const eventManager = guild.scheduledEvents;
  const event = await eventManager.create({
    name: video.snippet.title,
    scheduledStartTime: startTime,
    privacyLevel: "GUILD_ONLY",
    entityType: "EXTERNAL",
    description: video.snipper.description,
    entityMetadata: { location: `https://www.youtube.com/watch?v=${video.id}` },
    reason: "New stream scheduled on YouTube",
  });
}
