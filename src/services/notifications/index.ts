import { EmbedBuilder } from "discord.js";
import { Providers } from "../../providers";
import { API } from "../../providers/db/models/types";

export default function Notifications({ helperBot, models }: Providers) {
  helperBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName !== "notifications") {
      return;
    }

    const { options } = interaction;

    const subCommand = options.getSubcommand(false);

    if (subCommand !== "view") {
      return;
    }

    let settings: API.UserNotification.FetchSettingsByDiscordId;

    try {
      settings = await models.userNotifications.fetchSettingsByDiscordId(
        interaction.user.id
      );
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "Something went wrong. Please try again later.",
        ephemeral: true,
      });
      return;
    }

    const eventMessages = {
      events_new: "Notify me when new events are created.",
      events_pre: "Notify me in advance that an event is about to start.",
      events_forum_thread:
        "Automatically add me to the Forum Thread for a live event.",
      events_exclude_starlink:
        "Exclude Starlink launches from all my Event related notifications and actions.",
      events_exclude_unknown_china:
        "Exclude unknown Chinese launches from all my Event related notifications and actions.",
    };

    const eventSettings: string[] = [];

    for (const event in eventMessages) {
      let suffix = "";

      if (event === "events_pre" && settings.events_pre !== null) {
        suffix = ` Current warning time: ${settings.events_pre} minutes before the event`;
      }

      eventSettings.push(
        (settings[event] ? "✅" : "❌") + " " + eventMessages[event] + suffix
      );
    }

    const ndbMessages = {
      ndb_new: "Notify me when a new NDB prediction is made.",
      ndb_prediction_closed: "Notify me when my predictions are up for voting.",
      ndb_bet_closed: "Notify me when a prediction I bet on is up for voting",
      ndb_prediction_judged: "Notify me when my prediction is judged.",
      ndb_bet_judged: "Notify me when a prediction I bet on is judged.",
      ndb_bet_retired: "Notify me when a prediction I bet on is retired.",
      ndb_season_end: "Notify me when an NDB season ends.",
    };

    const ndbSettings: string[] = [];

    for (const event in ndbMessages) {
      ndbSettings.push(
        (settings[event] ? "✅" : "❌") + " " + ndbMessages[event]
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Notification Settings")
      .setDescription(
        "These are your current notification settings. You can change them at any time using the commands listed."
      )
      .addFields([
        {
          name: "Event-based Notifications",
          value:
            "These notifications are connected to Discord Events, including Off-Nominal Episodes, launches, press conferences, and other live events.\n\n" +
            eventSettings.join("\n") +
            "\n",
        },
        {
          name: "NDB Notifications",
          value:
            "These notifications are conneted to NDB predictions.\n\n" +
            ndbSettings.join("\n"),
        },
      ]);

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error(err);
    }
  });
}
