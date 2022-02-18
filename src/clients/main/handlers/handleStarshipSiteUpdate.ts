import { Client, MessageEmbed, TextChannel } from "discord.js";
import { GithubUpdateEmbedData } from "../../../listeners/siteListener";

const TEST_CHANNEL = process.env.TESTCHANNEL;
const BOCACHICACHANNELID = process.env.BOCACHICACHANNELID || TEST_CHANNEL;

const OWNER = "mendahu";
const REPO = "starship-site-tracking";
const BRANCH = process.env.STARSHIP_SITE_TRACKER_BRANCH;

export default async function handleStarshipSiteUpdate(
  update: GithubUpdateEmbedData
) {
  const client: Client = this;
  const embed: MessageEmbed = new MessageEmbed();

  const discordDate = `<t:${new Date(update.date).getTime()}:F>`;

  embed
    .setColor("#3e7493")
    .setTitle(`Change detected on Starship's Website`)
    .setDescription(`Change occured at ${discordDate}.`)
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
    const channel = await client.channels.fetch(BOCACHICACHANNELID);
    await (channel as TextChannel).send({ embeds: [embed] });
    console.log(`Discord successfully notified of changes to ${update.url}`);
  } catch (err) {
    console.error(err);
  }
}
