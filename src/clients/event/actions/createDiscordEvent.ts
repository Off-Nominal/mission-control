import fetchGuild from "../../actions/fetchGuild";
import { add } from "date-fns";
import { youtube_v3 } from "googleapis";

export default async function createDiscordEvent(
  video: youtube_v3.Schema$Video,
  client
) {
  // Find the new Discord Event start time
  // If the stream has started, sets it for 30 seconds from now
  // Otherwise uses scheduled time from YouTube.
  const startTime = video.liveStreamingDetails.actualStartTime
    ? add(new Date(), { seconds: 30 })
    : new Date(video.liveStreamingDetails.scheduledStartTime);

  const guild = fetchGuild(client);
  const eventManager = guild.scheduledEvents;
  const event = await eventManager.create({
    name: video.snippet.title,
    scheduledStartTime: startTime,
    scheduledEndTime: add(startTime, { minutes: 60 }),
    privacyLevel: "GUILD_ONLY",
    entityType: "EXTERNAL",
    description: video.snippet.description.split("\n")[0],
    entityMetadata: { location: `https://www.youtube.com/watch?v=${video.id}` },
    reason: "New stream scheduled on YouTube",
  });
}
