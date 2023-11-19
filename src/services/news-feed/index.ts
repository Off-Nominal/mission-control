import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";

import { Providers } from "../../providers";
import { contentBot } from "../../providers/discord_clients";
import { NewsManagerEvents } from "../../types/eventEnums";
import { NewsManager } from "./NewsManager";
import { listRSSFeeds } from "./list-rss-feeds";

export default function NewsFeed({ contentBot, sanityClient }: Providers) {
  const newsFeedListener = new NewsManager();

  contentBot.on("interactionCreate", (interaction) =>
    listRSSFeeds(interaction, sanityClient)
  );

  // newsFeedListener.on(
  //   NewsManagerEvents.NEW,
  //   (contentFeedItem: ContentFeedItem, text: string) => {
  //     handlers.content.handleNewContent(contentFeedItem, contentBot, "news", {
  //       text,
  //     });
  //   }
  // );
}
