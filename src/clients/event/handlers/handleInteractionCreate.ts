import { add } from "date-fns";
import { Interaction, MessageEmbed } from "discord.js";
import { Client } from "pg";
import { setEventSubscriptions } from "../../../queries/users";
import createDiscordEvent from "../actions/createDiscordEvent";

const livechatChannelID = process.env.LIVECHATCHANNELID;

enum AllowedCommands {
  START = "start",
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
}

export default async function handleInteractionCreate(
  interaction: Interaction,
  db: Client
) {
  if (!interaction.isCommand()) return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === AllowedCommands.START) {
    const url = options.getString("url", true);
    const duration = options.getInteger("duration", true);
    const name = options.getString("title");

    // Discord events have to be in the future, so this just sets it 2 seconds into the future
    // Hopefully this accounts for rqeuest time from user to bot to Discord
    const scheduledStartTime = add(new Date(), { seconds: 2 });

    try {
      await createDiscordEvent(
        {
          name,
          scheduledStartTime,
          scheduledEndTime: add(scheduledStartTime, { minutes: duration }),
          privacyLevel: "GUILD_ONLY",
          entityType: "EXTERNAL",
          description: `Come hang out in <#${livechatChannelID}> and watch the event with us!`,
          entityMetadata: { location: url },
          reason: "User initiated slash command",
        },
        interaction.client
      );

      await interaction.reply({
        content: `Request receieved! Your event "${name}" will start imminently.`,
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
    let subscribe: boolean | undefined | null = undefined;
    let preEvent: number | undefined | null = undefined;

    if (subCommand === AllowedCommands.SUBSCRIBE) {
      subscribe = options.getBoolean("event-start") || undefined;
      preEvent = options.getInteger("pre-event") || undefined;
    }

    if (subCommand === AllowedCommands.UNSUBSCRIBE) {
      subscribe = null;
      preEvent = null;
    }

    if (subscribe === undefined && preEvent === undefined) {
      return await interaction.reply({
        content:
          "No parameters set, so no changes to your subscription settings.",
      });
    }

    const discordId = interaction.user.id;

    try {
      const userSettings = await setEventSubscriptions(
        db,
        discordId,
        subscribe,
        preEvent
      );
      const { auto_subscribe, pre_notification } = userSettings.rows[0];

      const embed = new MessageEmbed()
        .setTitle("Subscription updated!")
        .setDescription("Current subscription settings are:")
        .addFields([
          {
            name: "Event-Start Notifications",
            value: auto_subscribe ? "Enabled" : "Disabled",
          },
          {
            name: "Pre-Event Notification Time",
            value: pre_notification
              ? pre_notification + " minutes before the event"
              : "Disabled",
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
}
