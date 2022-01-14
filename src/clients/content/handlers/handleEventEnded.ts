import { GuildScheduledEvent } from "discord.js";
import { Feed, FeedList } from "../../..";
import fetchTextChannel from "../../actions/fetchChannel";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

const contentChannelId = process.env.CONTENTCHANNELID;

export default async function handleEventEnded(
  event: GuildScheduledEvent,
  feeds: FeedList
) {
  const offNomEpisode = feeds[Feed.OFF_NOMINAL_YOUTUBE].getEpisodeByUrl(
    event.url
  );
  const happyHourEpisode = feeds[Feed.HAPPY_HOUR].getEpisodeByUrl(event.url);

  const episode = offNomEpisode || happyHourEpisode;

  if (!episode) {
    return;
  }

  const embed = createUniqueResultEmbed(episode);
  try {
    const channel = await fetchTextChannel(event.client, contentChannelId);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}
