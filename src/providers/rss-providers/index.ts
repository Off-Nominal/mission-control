import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import mcconfig from "../../mcconfig";
import { ContentListener, ContentListenerEvents } from "./ContentListener";
import { simpleCastFeedMapper, youtubeFeedMapper } from "./FeedWatcher";
import { NewsManager, NewsManagerEvents } from "./NewsListener";

// WeMartians
const wmFeedListener = new ContentListener(mcconfig.content.rss.wm, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
wmFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("wmFeedListener");
});
wmFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
wmFeedListener.initialize();
// wmFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   setTimeout(() => {
//     handlers.content.handleNewContent(content, contentBot, "content");
//   }, 600000);
// });

// MECO
const mecoFeedListener = new ContentListener(mcconfig.content.rss.meco, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
mecoFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("mecoFeedListener");
});
mecoFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
mecoFeedListener.initialize();
// mecoFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// Off-Nominal Podcast
const ofnFeedListener = new ContentListener(mcconfig.content.rss.ofn, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
ofnFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("ofnFeedListener");
});
ofnFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
ofnFeedListener.initialize();
// ofnFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// Red Planet Review
const rprFeedListener = new ContentListener(mcconfig.content.rss.rpr, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
rprFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("rprFeedListener");
});
rprFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
rprFeedListener.initialize();
// rprFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// MECO Headlines
const hlFeedListener = new ContentListener(mcconfig.content.rss.hl, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
hlFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("hlFeedListener");
});
hlFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
hlFeedListener.initialize();
// hlFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.content.handleNewContent(content, contentBot, "content");
// });

// Off-Nominal Happy Hour
const hhFeedListener = new ContentListener(mcconfig.content.rss.ofn_hh, {
  processor: youtubeFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.youtube,
});
hhFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("hhFeedListener");
});
hhFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
hhFeedListener.initialize();
// hhFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.events.handleNewContent(content, eventsBot);
// });

// Off-Nominal YouTube
const ytFeedListener = new ContentListener(mcconfig.content.rss.ofn_yt, {
  processor: youtubeFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.youtube,
});
ytFeedListener.once(ContentListenerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("ytFeedListener");
});
ytFeedListener.once(ContentListenerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
ytFeedListener.initialize();
// ytFeedListener.on(ContentListnerEvents.NEW, (content) => {
//   handlers.events.handleNewContent(content, eventsBot);
// });
// ytFeedListener.on(ContentListnerEvents.STREAM_START, streamHost.startParty);
// ytFeedListener.on(ContentListnerEvents.STREAM_END, streamHost.endParty);

const newsFeedListener = new NewsManager();
newsFeedListener.once(NewsManagerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("newsFeed");
});
newsFeedListener.once(NewsManagerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});
newsFeedListener.initialize();

export default {
  yt: ytFeedListener,
  hh: hhFeedListener,
  hl: hlFeedListener,
  rpr: rprFeedListener,
  ofn: ofnFeedListener,
  meco: mecoFeedListener,
  wm: wmFeedListener,
  news: newsFeedListener,
};
