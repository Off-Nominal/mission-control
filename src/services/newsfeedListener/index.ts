import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";
import handlers from "../../clients/handlers";
import { contentBot } from "../../discord_clients";
import { NewsManagerEvents } from "../../types/eventEnums";
import { NewsManager } from "./NewsManager";

const newsFeedListener = new NewsManager();

// newsFeedListener.on(
//   NewsManagerEvents.NEW,
//   (contentFeedItem: ContentFeedItem, text: string) => {
//     handlers.content.handleNewContent(contentFeedItem, contentBot, "news", {
//       text,
//     });
//   }
// );

export default newsFeedListener;
