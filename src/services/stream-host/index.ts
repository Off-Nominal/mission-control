import { GuildScheduledEvent, ThreadChannel } from "discord.js";
import { Providers } from "../../providers";
import { ManagedStream } from "./ManagedStream";

export default function StreamHost({
  eventsBot,
  rssProviders,
  sanityClient,
  mcconfig,
}: Providers) {
  const streamHost = new ManagedStream(sanityClient);

  eventsBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== "events") return;

    const { options } = interaction;
    const subCommand = options.getSubcommand(false);

    if (subCommand === "suggest") {
      const title = options.getString("title", true);
      streamHost.logSuggestion(title, interaction);
    }

    if (subCommand === "suggestions") {
      streamHost.viewSuggestions(interaction);
    }
  });

  const getStreamEventForumPost = (
    event: GuildScheduledEvent
  ): ThreadChannel => {
    const title = event.name;

    const channel = eventsBot.channels.cache.get(
      mcconfig.discord.channels.livechat
    );

    if (!channel.isThreadOnly()) return;

    const thread = channel.threads.cache.find((thread) => {
      return thread.name === title && thread.ownerId === eventsBot.user.id;
    });

    if (!thread) return;

    return thread;
  };

  eventsBot.on("guildScheduledEventUpdate", (oldEvent, newEvent) => {
    const isStream = rssProviders.yt.isStream(newEvent);

    if (!isStream) {
      return;
    }

    // Event started
    if (newEvent.isActive() && oldEvent.isScheduled()) {
      const forumPost = getStreamEventForumPost(newEvent);
      streamHost.startParty(newEvent, forumPost);
    }

    // Event ended
    if (newEvent.isCompleted() && oldEvent.isActive()) {
      streamHost.endParty();
    }
  });
}
