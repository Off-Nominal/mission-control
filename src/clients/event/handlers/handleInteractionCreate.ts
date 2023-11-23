import { add } from "date-fns";
import {
  GuildScheduledEventCreateOptions,
  EmbedBuilder,
  BaseInteraction,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventEntityType,
} from "discord.js";
import createDiscordEvent from "../../../actions/create-discord-event";
import mcconfig from "../../../mcconfig";
import { EventBotEvents } from "../../../providers/events-bot";

enum AllowedCommands {
  START = "start",
  SUGGEST = "suggest",
  SUGGESTIONS = "suggestions",
}

export default async function handleInteractionCreate(
  interaction: BaseInteraction
) {
  if (!interaction.isChatInputCommand()) return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === AllowedCommands.SUGGEST) {
    const title = options.getString("title", true);
    interaction.client.emit(EventBotEvents.NEW_TITLE, title, interaction);
  }

  if (subCommand === AllowedCommands.SUGGESTIONS) {
    interaction.client.emit(EventBotEvents.VIEW_TITLES, interaction);
  }

  if (subCommand === AllowedCommands.START) {
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
}
