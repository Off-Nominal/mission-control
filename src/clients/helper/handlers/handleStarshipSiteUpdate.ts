import {
  ChannelType,
  Client,
  EmbedBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { GithubUpdateEmbedData } from "../../../services/siteListener/SiteListener";
import mcconfig from "../../../mcconfig";

export default async function handleStarshipSiteUpdate(
  update: GithubUpdateEmbedData
) {
  const client: Client = this;
  const embed = new EmbedBuilder();

  embed
    .setColor("#3e7493")
    .setTitle(`Change detected on Starship's Website`)
    .setDescription(
      `Change occured at ${time(update.date, TimestampStyles.LongDateTime)}.`
    )
    .addFields([
      {
        name: "View",
        value: `[Starship Site](${update.url})`,
        inline: true,
      },
      {
        name: "Compare",
        value: `[Differences](${update.diffUrl})`,
        inline: true,
      },
      {
        name: "History",
        value: `[Recent Changes](https://github.com/${mcconfig.siteTracker.starship.owner}/${mcconfig.siteTracker.starship.repo}/blob/${mcconfig.siteTracker.starship.branch}/log.json)`,
        inline: true,
      },
    ])
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(
      mcconfig.discord.channels.boca_chica
    );
    if (channel.type !== ChannelType.GuildText) return;
    await channel.send({ embeds: [embed] });
    console.log(`Discord successfully notified of changes to ${update.url}`);
  } catch (err) {
    console.error(err);
  }
}
