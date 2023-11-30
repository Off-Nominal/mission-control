import { BaseInteraction, EmbedBuilder } from "discord.js";
import { User } from "../../providers/db/models/User";

export async function setSubscriptions(
  interaction: BaseInteraction,
  user: User
) {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "events") return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === "subscribe" || subCommand === "unsubscribe") {
    // undefined means the user submitted no input (don't change)
    // null means the user requested to unsubscribe
    // false means the user requested to unsubscribe
    // true or a number is a request to subscribe
    let newEvent: boolean | undefined | null = undefined;
    let preEvent: number | undefined | null = undefined;

    if (subCommand === "subscribe") {
      const newEventInput = options.getBoolean("new-event");
      newEvent = newEventInput === null ? undefined : newEventInput;
      preEvent = options.getInteger("pre-event") || undefined;
    }

    if (subCommand === "unsubscribe") {
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
      const userSettings = await user.setEventSubscriptions(
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
}
