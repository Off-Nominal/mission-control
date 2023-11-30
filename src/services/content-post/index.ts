import { ChannelType } from "discord.js";
import createUniqueResultEmbed from "../../actions/create-unique-result-embed";
import { postContent } from "../../actions/post-to-content-channel";
import { Providers } from "../../providers";
import { ContentListenerEvents } from "../../providers/rss-providers/ContentListener";
import { parseCommands } from "../../helpers/parseCommands";

export default function ContentPost({
  eventsBot,
  rssProviders,
  contentBot,
  helperBot,
  mcconfig,
}: Providers) {
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

  // Dev command to manually trigger a content item for testing
  helperBot.on("messageCreate", (message) => {
    if (mcconfig.env !== "dev") return;

    const [prefix, show] = parseCommands(message);

    if (prefix !== "!content") return;

    if (!show) {
      message.reply({
        content: "Please add a show title as an argument",
      });
      return;
    }
    rssProviders[show].emit(
      ContentListenerEvents.NEW,
      rssProviders[show].fetchRecent()
    );
  });

  // YouTube Streams
  eventsBot.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
    const isStream = rssProviders.yt.isStream(newEvent);

    if (!isStream) return;

    const offNomEpisode = rssProviders.yt.getEpisodeByUrl(
      newEvent.entityMetadata.location
    );
    const happyHourEpisode = rssProviders.hh.getEpisodeByUrl(
      newEvent.entityMetadata.location
    );

    const episode = offNomEpisode || happyHourEpisode;

    if (!episode) return;

    postContent(episode, eventsBot, "content");
  });
}
