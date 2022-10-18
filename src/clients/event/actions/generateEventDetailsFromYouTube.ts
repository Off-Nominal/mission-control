import { add } from "date-fns";
import {
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
} from "discord.js";
import { youtube_v3 } from "googleapis";

export default function generateEventDetailsFromYouTube(
  video: youtube_v3.Schema$Video
): GuildScheduledEventCreateOptions {
  // Find the new Discord Event start time
  // If the stream has started, sets it for 30 seconds from now
  // Otherwise uses scheduled time from YouTube.
  const scheduledStartTime = video.liveStreamingDetails.actualStartTime
    ? add(new Date(), { seconds: 30 })
    : new Date(video.liveStreamingDetails.scheduledStartTime);

  return {
    name: video.snippet.title,
    scheduledStartTime,
    scheduledEndTime: add(scheduledStartTime, { minutes: 60 }),
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.External,
    description: video.snippet.description.split("\n")[0],
    entityMetadata: { location: `https://www.youtube.com/watch?v=${video.id}` },
    reason: "New stream scheduled on YouTube",
    image: video.snippet.thumbnails?.high?.url || "",
  };
}
