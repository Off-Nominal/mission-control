import fetchGuild from "../../actions/fetchGuild";
import { add } from "date-fns";

export default async function createDiscordEvent(video, client) {
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
