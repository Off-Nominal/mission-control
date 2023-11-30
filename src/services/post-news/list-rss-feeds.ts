import { SanityClient } from "@sanity/client";
import { EmbedBuilder, Interaction } from "discord.js";
import { NewsCategoryDocument } from "../../providers/sanity";
import mcconfig from "../../mcconfig";

export function listRSSFeeds(interaction: Interaction, client: SanityClient) {
  if (!interaction.isChatInputCommand()) return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand !== "rss") {
    return;
  }

  const query =
    '*[_type == "newsCategory"] | order(name) {name, _id, "feeds": *[_type == "newsFeed" && references(^._id)] | order(name) {name, url}}';

  client
    .fetch<NewsCategoryDocument[]>(query)
    .catch((err) => console.error(err))
    .then((categories: NewsCategoryDocument[]) => {
      const feedsFields = categories.map((category) => {
        const feeds = category.feeds.map((feed) => feed.name).join("\n");
        return { name: category.name, value: feeds };
      });

      const embed = new EmbedBuilder({
        title: "Currently Subscribed RSS Feeds",
        description: `These are the feeds currently being posted in <#${mcconfig.discord.channels.news}>.`,
        fields: feedsFields,
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    })
    .catch((err) => console.error(err));
}
