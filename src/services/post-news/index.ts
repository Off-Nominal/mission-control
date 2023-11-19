import { Providers } from "../../providers";
import {
  postContent,
  ContentFeedItem,
} from "../../actions/post-to-content-channel";
import { NewsManagerEvents } from "../../types/eventEnums";
import { listRSSFeeds } from "./list-rss-feeds";

export default function PostNews({
  contentBot,
  sanityClient,
  rssProviders,
}: Providers) {
  contentBot.on("interactionCreate", (interaction) =>
    listRSSFeeds(interaction, sanityClient)
  );

  rssProviders.news.on(
    NewsManagerEvents.NEW,
    (contentFeedItem: ContentFeedItem, text: string) => {
      postContent(contentFeedItem, contentBot, "news", {
        text,
      });
    }
  );
}
