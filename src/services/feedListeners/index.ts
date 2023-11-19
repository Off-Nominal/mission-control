import mcconfig from "../../mcconfig";
import { ContentListener } from "../../listeners/contentListener/contentListener";
import {
  simpleCastFeedMapper,
  youtubeFeedMapper,
} from "../../utilities/FeedWatcher";
import { ContentListnerEvents } from "../../types/eventEnums";
import deployWeMartians from "../../utilities/deployWeMartians";
import handlers from "../../clients/handlers";
import { contentBot, eventsBot } from "../../providers/discord_clients";
import streamHost from "../streamHost";

// WeMartians
const wmFeedListener = new ContentListener(mcconfig.content.rss.wm, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
// wmFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   deployWeMartians();
//   setTimeout(() => {
//     handlers.content.handleNewContent(content, contentBot, "content");
//   }, 600000);
// });

// MECO
const mecoFeedListener = new ContentListener(mcconfig.content.rss.meco, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
// mecoFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// Off-Nominal Podcast
const ofnFeedListener = new ContentListener(mcconfig.content.rss.ofn, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
// ofnFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// Red Planet Review
const rprFeedListener = new ContentListener(mcconfig.content.rss.rpr, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
// rprFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// MECO Headlines
const hlFeedListener = new ContentListener(mcconfig.content.rss.hl, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
// hlFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// Off-Nominal Happy Hour
const hhFeedListener = new ContentListener(mcconfig.content.rss.ofn_hh, {
  processor: youtubeFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.youtube,
});
// hhFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.events.handleNewContent(content, eventsBot);
// });

// Off-Nominal YouTube
const ytFeedListener = new ContentListener(mcconfig.content.rss.ofn_yt, {
  processor: youtubeFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.youtube,
});
// ytFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.events.handleNewContent(content, eventsBot);
// });
// ytFeedListener.on(ContentListnerEvents.STREAM_START, streamHost.startParty);
// ytFeedListener.on(ContentListnerEvents.STREAM_END, streamHost.endParty);

export default {
  yt: ytFeedListener,
  hh: hhFeedListener,
  hl: hlFeedListener,
  rpr: rprFeedListener,
  ofn: ofnFeedListener,
  meco: mecoFeedListener,
  wm: wmFeedListener,
};
