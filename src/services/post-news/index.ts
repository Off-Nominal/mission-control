import { Providers } from "../../providers";
import {
  postContent,
  ContentFeedItem,
} from "../../actions/post-to-content-channel";
import { listRSSFeeds } from "./list-rss-feeds";
import { NewsManagerEvents } from "../../providers/rss-providers/NewsListener";

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
