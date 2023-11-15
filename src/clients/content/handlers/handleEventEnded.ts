import { ChannelType, Client, GuildScheduledEvent } from "discord.js";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";
import mcconfig from "../../../mcconfig";
import feedListeners from "../../../services/feedListeners";

export default async function handleEventEnded(
  event: GuildScheduledEvent,
  client: Client
) {
  const offNomEpisode = feedListeners.yt.getEpisodeByUrl(
    event.entityMetadata.location
  );
  const happyHourEpisode = feedListeners.hh.getEpisodeByUrl(
    event.entityMetadata.location
  );

  const episode = offNomEpisode || happyHourEpisode;

  if (!episode) {
    return;
  }

  const embed = createUniqueResultEmbed(episode);
  try {
    const channel = await client.channels.fetch(
      mcconfig.discord.channels.content
    );

    if (channel.type !== ChannelType.GuildAnnouncement) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}
