import { SanityDocument } from "@sanity/client";
import { Interaction, EmbedBuilder } from "discord.js";
import { sanityClient } from "../../../cms/client";
import { NewsFeedDocument } from "../../../listeners/newsManager/newsManager";

const NEWS_CHANNEL_ID = process.env.NEWS_CHANNEL_ID;

export interface NewsCategoryDocument extends SanityDocument {
  name: string;
  feeds: NewsFeedDocument[];
}

export default function handleRssList(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const query =
    '*[_type == "newsCategory"] | order(name) {name, _id, "feeds": *[_type == "newsFeed" && references(^._id)] | order(name) {name, url}}';

  sanityClient
    .fetch<NewsCategoryDocument[]>(query)
    .catch((err) => console.error(err))
    .then((categories: NewsCategoryDocument[]) => {
      const feedsFields = categories.map((category) => {
        const feeds = category.feeds.map((feed) => feed.name).join("\n");
        return { name: category.name, value: feeds };
      });

      const embed = new EmbedBuilder({
        title: "Currently Subscribed RSS Feeds",
        description: `These are the feeds currently being posted in <#${NEWS_CHANNEL_ID}>.`,
        fields: feedsFields,
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    })
    .catch((err) => console.error(err));
}
