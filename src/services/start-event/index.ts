import { add } from "date-fns";
import { Providers } from "../../providers";
import {
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
} from "discord.js";
import createDiscordEvent from "../../actions/create-discord-event";

export default function StartEvent({ eventsBot, mcconfig }: Providers) {
  eventsBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== "events") return;

    const { options } = interaction;
    const subCommand = options.getSubcommand(false);

    if (subCommand === "start") {
      const url = options.getString("url", true);
      const duration = options.getInteger("duration", true);
      const name = options.getString("title");

      // Discord events have to be in the future, so this just sets it 2 seconds into the future
      // Hopefully this accounts for rqeuest time from user to bot to Discord
      const scheduledStartTime = add(new Date(), { seconds: 2 });

      const eventOptions: GuildScheduledEventCreateOptions = {
        name,
        scheduledStartTime,
        scheduledEndTime: add(scheduledStartTime, { minutes: duration }),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        description: `Come hang out in <#${mcconfig.discord.channels.livechat}> and watch the event with us!`,
        entityMetadata: { location: url },
        reason: "User initiated slash command",
      };

      try {
        await createDiscordEvent(eventOptions, interaction.client);
        await interaction.reply({
          content: `Your event "${name}" will start imminently.\n\n${url}`,
        });
      } catch (err) {
        await interaction.reply({
          content:
            "Something went wrong with the event creation. Please let Jake know and try again!",
          ephemeral: true,
        });
        console.error(err);
      }
    }
  });
}
