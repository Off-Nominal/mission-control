import { Interaction, MessageEmbed } from "discord.js";

const NEWS_CHANNEL_ID = process.env.NEWS_CHANNEL_ID;

export default function handleRssList(
  interaction: Interaction,
  feedList: { name: string; url: string; thumbnail: string }[]
) {
  if (!interaction.isCommand()) return;
  const feedsFields = feedList.sort().map((feed) => {
    return `[[Link]](${feed.url}) - ${feed.name}`;
  });

  const embed = new MessageEmbed({
    title: "Currently Subscribed RSS Feeds",
    description: `These are the feeds currently being posted in <#${NEWS_CHANNEL_ID}>.`,
    fields: [
      {
        name: "Feeds",
        value: feedsFields.join("\n"),
      },
    ],
  });

  interaction.reply({ embeds: [embed], ephemeral: true });
}
