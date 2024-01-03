import { EmbedBuilder } from "discord.js";
import { API } from "../../providers/db/models/types";

export const generateViewSettingsEmbed = (
  settings: API.UserNotification.FetchSettingsByDiscordId
) => {
  const eventMessages = {
    events_new: "Notify me when new events are created.",
    events_pre: "Notify me in advance that an event is about to start.",
    events_forum_thread:
      "Automatically add me to the Forum Thread for a live event.",
    events_exclusions_starlink:
      "Exclude Starlink launches from all my Event related notifications and actions.",
    events_exclusions_unknown_china:
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
    ndb_prediction_judged: "Notify me when my predictions are judged.",
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

  return embed;
};
