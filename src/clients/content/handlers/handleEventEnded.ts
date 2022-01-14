import { GuildScheduledEvent } from "discord.js";
import { Feed, FeedList } from "../../..";

export default function handleEventEnded(
  event: GuildScheduledEvent,
  feeds: FeedList
) {
  const isYouTube = feeds[Feed.OFF_NOMINAL_YOUTUBE].getEpisodeByUrl(event.url);
  const isHappyHour = feeds[Feed.HAPPY_HOUR].getEpisodeByUrl(event.url);

  if (!isYouTube && !isHappyHour) {
    return;
  }
}
