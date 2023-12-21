import { Providers } from "../../providers";
import { API } from "../../providers/db/models/types";
import { generateViewSettingsEmbed } from "./generateViewSettingsEmbed";

const commandMap = {
  ["events-new"]: "events_new",
  ["events-pre_event"]: "events_pre",
  ["events-add_to_forum_thread"]: "events_forum_thread",
  ["events-exclude_starlink"]: "events_exclusions_starlink",
  ["events-exclude_unknown_china"]: "events_exclusions_unknown_china",
  ["ndb-new_prediction"]: "ndb_new",
  ["ndb-my_prediction_due"]: "ndb_prediction_closed",
  ["ndb-my_bet_due"]: "ndb_bet_closed",
  ["ndb-my_prediction_judged"]: "ndb_prediction_judged",
  ["ndb-my_bet_judged"]: "ndb_bet_judged",
  ["ndb-my_bet_retired"]: "ndb_bet_retired",
  ["ndb-season_ended"]: "ndb_season_end",
};

export default function Notifications({ helperBot, models }: Providers) {
  // View settings
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

    const embed = generateViewSettingsEmbed(settings);

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error(err);
    }
  });

  helperBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;
    const subCommandGroup = options.getSubcommandGroup(false);

    if (commandName !== "notifications" || subCommandGroup !== "set") {
      return;
    }

    const subCommand = options.getSubcommand(false);
    const setting = commandMap[subCommand];

    if (!API.UserNotification.isUserNotification(setting)) {
      interaction.reply({
        content: "Something went wrong. Please try again later.",
        ephemeral: true,
      });
      return;
    }

    let value: any = options.getBoolean("setting");

    if (subCommand === "events-pre_event") {
      if (value === true) {
        value = null;
      } else {
        value = options.getInteger("minutes");
      }
    }

    try {
      await models.userNotifications.setNotification(interaction.user.id, {
        key: setting,
        value,
      });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "Something went wrong. Please try again later.",
        ephemeral: true,
      });
      return;
    }

    interaction.reply("setting updated!");
  });
}
