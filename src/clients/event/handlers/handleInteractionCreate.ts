import { add } from "date-fns";
import {
  GuildScheduledEventCreateOptions,
  Interaction,
  EmbedBuilder,
  InteractionType,
} from "discord.js";
import { Client } from "pg";
import userQueries from "../../../queries/users";
import { EventBotEvents } from "../../../types/eventEnums";
import createDiscordEvent from "../actions/createDiscordEvent";

const livechatChannelID = process.env.LIVECHATCHANNELID;

enum AllowedCommands {
  START = "start",
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
  SUGGEST = "suggest",
  SUGGESTIONS = "suggestions",
}

export default function generateInteractionCreateHandler(db: Client) {
  const { setEventSubscriptions } = userQueries(db);

  return async function handleInteractionCreate(interaction: Interaction) {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const { options } = interaction;
    const subCommand = options.getSubcommand(false);

    if (subCommand === AllowedCommands.SUGGEST) {
      const title = options.getString("title", true);
      this.emit(EventBotEvents.NEW_TITLE, title, interaction);
    }

    if (subCommand === AllowedCommands.SUGGESTIONS) {
      this.emit(EventBotEvents.VIEW_TITLES, interaction);
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
        privacyLevel: "GUILD_ONLY",
        entityType: "EXTERNAL",
        description: `Come hang out in <#${livechatChannelID}> and watch the event with us!`,
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

    if (
      subCommand === AllowedCommands.SUBSCRIBE ||
      subCommand === AllowedCommands.UNSUBSCRIBE
    ) {
      // undefined means the user submitted no input (don't change)
      // null means the user requested to unsubscribe
      // false means the user requested to unsubscribe
      // true or a number is a request to subscribe
      let newEvent: boolean | undefined | null = undefined;
      let preEvent: number | undefined | null = undefined;

      if (subCommand === AllowedCommands.SUBSCRIBE) {
        const newEventInput = options.getBoolean("new-event");
        newEvent = newEventInput === null ? undefined : newEventInput;
        preEvent = options.getInteger("pre-event") || undefined;
      }

      if (subCommand === AllowedCommands.UNSUBSCRIBE) {
        newEvent = null;
        preEvent = null;
      }

      if (newEvent === undefined && preEvent === undefined) {
        return await interaction.reply({
          content:
            "No parameters set, so no changes to your notificatin subscription settings.",
          ephemeral: true,
        });
      }

      try {
        const userSettings = await setEventSubscriptions(
          interaction.user.id,
          newEvent,
          preEvent
        );

        const { new_event, pre_notification } = userSettings.rows[0];

        const embed = new EmbedBuilder()
          .setTitle("Subscription updated!")
          .setDescription("Current subscription settings are:")
          .addFields([
            {
              name: "New Event Notifications",
              value: new_event ? "Enabled" : "Disabled",
              inline: true,
            },
            {
              name: "Pre-Event Notification Time",
              value: pre_notification
                ? pre_notification + " minutes before the event"
                : "Disabled",
              inline: true,
            },
          ]);

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return await interaction.reply({
          content:
            "Something went wrong setting your subscriptions. Please let Jake know!",
          ephemeral: true,
        });
      }
    }
  };
}
