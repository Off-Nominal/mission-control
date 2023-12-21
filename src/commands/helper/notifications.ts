import {
  ApplicationCommandOptionType,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

export enum MCNotificationCommand {
  EVENTS_NEW = "events-new",
  EVENTS_PRE = "events-pre_event",
  EVENTS_FORUM_THREAD = "events-add_to_forum_thread",
  EVENTS_EXCLUSIONS_STARLINK = "events-exclude_starlink",
  EVENTS_EXCLUSIONS_UNKNOWN_CHINA = "events-exclude_unknown_china",
  NDB_NEW = "ndb-new_prediction",
  NDB_PREDICTION_CLOSED = "ndb-my_prediction_due",
  NDB_BET_CLOSED = "ndb-my_bet_due",
  NDB_PREDICTION_JUDGED = "ndb-my_prediction_judged",
  NDB_BET_JUDGED = "ndb-my_bet_judged",
  NDB_BET_RETIRED = "ndb-my_bet_retired",
  NDB_SEASON_END = "ndb-season_ended",
}

type MCSubCommandOption = {
  description: string;
  name: string;
  required?: boolean;
  type: ApplicationCommandOptionType;
};

type MCSubCommand = {
  description: string;
  name: MCNotificationCommand;
  options?: MCSubCommandOption[];
};

const notificationSubCommands: MCSubCommand[] = [
  {
    description: "Notify me of new Discord Events",
    name: MCNotificationCommand.EVENTS_NEW,
  },
  {
    description: "Notify me in advance of Discord Events beginning",
    name: MCNotificationCommand.EVENTS_PRE,
    options: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "minutes",
        description: "Number of minutes in advance to notify",
        required: true,
      },
    ],
  },
  {
    description: "Add me to Event Forum Threads",
    name: MCNotificationCommand.EVENTS_FORUM_THREAD,
  },
  {
    description: "Exclude Starlink launches from my Event notifications",
    name: MCNotificationCommand.EVENTS_EXCLUSIONS_STARLINK,
  },
  {
    description: "Exclude Unknown Chinese launches from my Event notifications",
    name: MCNotificationCommand.EVENTS_EXCLUSIONS_UNKNOWN_CHINA,
  },
  {
    description: "Notify me when a new NDB prediction is made",
    name: MCNotificationCommand.NDB_NEW,
  },
  {
    description: "Notify me when one of my predictions is up for voting",
    name: MCNotificationCommand.NDB_PREDICTION_CLOSED,
  },
  {
    description: "Notify me when any prediction I bet on is up for voting",
    name: MCNotificationCommand.NDB_BET_CLOSED,
  },
  {
    description: "Notify me when one of my predictions is judged",
    name: MCNotificationCommand.NDB_PREDICTION_JUDGED,
  },
  {
    description: "Notify me when any prediction I bet on is judged",
    name: MCNotificationCommand.NDB_BET_JUDGED,
  },
  {
    description: "Notify me when any prediction I bet on is retired",
    name: MCNotificationCommand.NDB_BET_RETIRED,
  },
  {
    description: "Notify me when the NDB season ends",
    name: MCNotificationCommand.NDB_SEASON_END,
  },
];

export const notificationSubcommandGroup =
  new SlashCommandSubcommandGroupBuilder()
    .setName("set")
    .setDescription("Set a specific notification setting on or off");

for (const subCommand of notificationSubCommands) {
  const command = new SlashCommandSubcommandBuilder()
    .setName(subCommand.name)
    .setDescription(subCommand.description)
    .addBooleanOption((option) =>
      option
        .setName("setting")
        .setDescription("Turn this setting on or off")
        .setRequired(true)
    );

  for (const option of subCommand.options || []) {
    if (option.type === ApplicationCommandOptionType.Integer) {
      command.addIntegerOption((o) =>
        o
          .setName(option.name)
          .setDescription(option.description)
          .setRequired(option.required)
      );
    }
  }

  notificationSubcommandGroup.addSubcommand(command);
}
