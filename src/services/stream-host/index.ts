import { GuildScheduledEvent, ThreadChannel } from "discord.js";
import { Providers } from "../../providers";
import { ManagedStream } from "./ManagedStream";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";

export default function StreamHost({
  eventsBot,
  rssProviders,
  sanityClient,
  mcconfig,
}: Providers) {
  const streamHost = new ManagedStream(sanityClient, eventsBot);

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

  const getStreamEventForumPost = async (
    event: GuildScheduledEvent
  ): Promise<ThreadChannel> => {
    const title = event.name;

    const channel = eventsBot.channels.cache.get(
      mcconfig.discord.channels.livechat
    );

    if (!channel.isThreadOnly()) return;

    const thread = await channel.threads.cache.find((thread) => {
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

    const logger = new Logger(
      "StreamHost",
      LogInitiator.DISCORD,
      "Stream Event Change"
    );

    // Event started
    if (newEvent.isActive() && oldEvent.isScheduled()) {
      logger.addLog(LogStatus.INFO, "Event started");
      getStreamEventForumPost(newEvent)
        .then((forumPost) => {
          logger.addLog(LogStatus.SUCCESS, "Found forum thread");
          streamHost.startParty(newEvent, forumPost);
          logger.addLog(LogStatus.SUCCESS, "Started stream party");
        })
        .catch((err) => {
          logger.addLog(LogStatus.FAILURE, "Failed to find forum thread");
        })
        .finally(() => {
          logger.sendLog(eventsBot);
        });
    }

    // Event ended
    if (newEvent.isCompleted() && oldEvent.isActive()) {
      logger.addLog(LogStatus.INFO, "Event ended");
      streamHost.endParty();
      logger.addLog(LogStatus.SUCCESS, "Started stream party");
      logger.sendLog(eventsBot);
    }
  });
}
