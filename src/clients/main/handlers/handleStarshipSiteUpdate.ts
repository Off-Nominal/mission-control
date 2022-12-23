import {
  ChannelType,
  Client,
  EmbedBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { GithubUpdateEmbedData } from "../../../listeners/siteListener";
import { SpecificChannel, channelIds } from "../../../types/channelEnums";

const OWNER = "mendahu";
const REPO = "starship-site-tracking";
const BRANCH = process.env.STARSHIP_SITE_TRACKER_BRANCH;

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
        value: `[Recent Changes](https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/log.json)`,
        inline: true,
      },
    ])
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(
      channelIds[SpecificChannel.BOCA_CHICA]
    );
    if (channel.type !== ChannelType.GuildText) return;
    await channel.send({ embeds: [embed] });
    console.log(`Discord successfully notified of changes to ${update.url}`);
  } catch (err) {
    console.error(err);
  }
}
