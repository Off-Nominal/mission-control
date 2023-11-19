import { postContent } from "../../actions/post-to-content-channel";
import { Providers } from "../../providers";
import { ContentListenerEvents } from "../../providers/rss-providers/ContentListener";

export default function ContentPost({ rssProviders, contentBot }: Providers) {
  // Podcast RSS Content
  rssProviders.wm.on(ContentListenerEvents.NEW, (content) => {
    // WeMartianas has a 10 minute delay to await site building
    setTimeout(() => {
      postContent(content, contentBot, "content");
    }, 600000);
  });

  rssProviders.meco.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  rssProviders.ofn.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  rssProviders.rpr.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });

  rssProviders.hl.on(ContentListenerEvents.NEW, (content) => {
    postContent(content, contentBot, "content");
  });
}
