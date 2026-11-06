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
// News Feed Listener
const newsFeedListener = new NewsManager();
newsFeedListener.once(NewsManagerEvents.READY, (message) => {
  bootLogger.addLog(LogStatus.SUCCESS, message);
  bootLogger.logItemSuccess("newsFeed");
});
newsFeedListener.on(NewsManagerEvents.ERROR, (message) => {
  bootLogger.addLog(LogStatus.FAILURE, message);
});

export function rssBootTasks() {
  return [
    { name: "wmFeedListener", run: () => wmFeedListener.initialize() },
    { name: "mecoFeedListener", run: () => mecoFeedListener.initialize() },
    { name: "ofnFeedListener", run: () => ofnFeedListener.initialize() },
    { name: "rprFeedListener", run: () => rprFeedListener.initialize() },
    { name: "hlFeedListener", run: () => hlFeedListener.initialize() },
    { name: "hhFeedListener", run: () => hhFeedListener.initialize() },
    { name: "ytFeedListener", run: () => ytFeedListener.initialize() },
    { name: "newsFeed", run: () => newsFeedListener.initialize() },
  ];
}

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
