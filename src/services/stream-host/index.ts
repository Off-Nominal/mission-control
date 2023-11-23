import { ChannelType } from "discord.js";
import { Providers } from "../../providers";
import { ManagedStream, StreamHostEvents } from "./ManagedStream";

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

  eventsBot.on("guildScheduledEventUpdate", (oldEvent, newEvent) => {
    const isStream = rssProviders.yt.isStream(newEvent);

    if (!isStream) {
      return;
    }

    if (newEvent.isActive() && oldEvent.isScheduled()) {
      streamHost.startParty(newEvent);
    }

    if (newEvent.isCompleted() && oldEvent.isActive()) {
      const message = streamHost.endParty();

      const channel = eventsBot.channels.cache.get(
        mcconfig.discord.channels.livechat
      );

      if (!channel.isTextBased()) return;

      channel.send(message);
    }
  });

  streamHost.on(StreamHostEvents.PARTY_MESSAGE, async (message, event) => {
    try {
      const channel = await event.client.channels.fetch(
        mcconfig.discord.channels.livechat
      );
      if (!channel.isTextBased()) return;
      channel.send(message);
    } catch (err) {
      console.error(err);
    }
  });
}
