import {
  APIApplicationCommandOptionChoice,
  SlashCommandBuilder,
} from "discord.js";

export enum Ndb2Subcommand {
  NEW = "new",
  VIEW = "view",
  ENDORSE = "endorse",
  UNDORSE = "undorse",
  RETIRE = "retire",
  TRIGGER = "trigger",
  SCORE = "score",
  HELP = "help",
  LIST = "list",
  SEARCH = "search",
  LEADERBOARDS = "leaderboards",
  SNOOZE = "snooze",
}

const listOptions: APIApplicationCommandOptionChoice<string>[] = [
  { name: "Recently Made", value: "recent" },
  { name: "Upcoming Judgements", value: "upcoming" },
  { name: "My Upcoming Judgements", value: "upcoming-mine" },
  { name: "Upcoming Judgements I haven't Bet on", value: "upcoming-no-bet" },
];

const leaderboardOptions: APIApplicationCommandOptionChoice<string>[] = [
  { name: "Most Points", value: "points" },
  { name: "Most Successful Predictions", value: "predictions" },
  { name: "Most Successful Bets", value: "bets" },
];

const timeWindowOptions: APIApplicationCommandOptionChoice<string>[] = [
  { name: "Current Season", value: "current" },
  { name: "Last Season", value: "last" },
  { name: "All Time", value: "alltime" },
];

// Predict
const predictCommand = new SlashCommandBuilder()
  .setName("predict")
  .setDescription("Work with Nostradambot2 Predictions")
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.NEW)
      .setDescription("Create a new Prediction")
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.VIEW)
      .setDescription("View a Prediction")
      .addIntegerOption((option) =>
        option
          .setName("id")
          .setDescription("Prediction ID")
          .setRequired(true)
          .setMaxValue(2147483647)
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.RETIRE)
      .setDescription("Cancel a Prediction you made within last 12 hours")
      .addIntegerOption((option) =>
        option
          .setName("id")
          .setDescription("Prediction ID")
          .setRequired(true)
          .setMaxValue(2147483647)
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.TRIGGER)
      .setDescription("Trigger a prediction to be voted on")
      .addIntegerOption((option) =>
        option
          .setName("id")
          .setDescription("Prediction ID")
          .setRequired(true)
          .setMaxValue(2147483647)
      )
      .addStringOption((option) =>
        option
          .setName("closed")
          .setDescription(
            "Effective Date of close (if this prediction is being triggered late). Format YYYY-MM-DD"
          )
          .setMinLength(10)
          .setMaxLength(10)
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.SNOOZE)
      .setDescription("Change the check date of an Event-driven prediction")
      .addIntegerOption((option) =>
        option
          .setName("id")
          .setDescription("Prediction ID")
          .setRequired(true)
          .setMaxValue(2147483647)
      )
      .addStringOption((option) =>
        option
          .setName("check_date")
          .setDescription(
            "What date should NDB2 check up on this prediction? Format YYYY-MM-DD"
          )
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(10)
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.SCORE)
      .setDescription("View your Nostradambot Scores")
      .addStringOption((option) =>
        option
          .setName("window")
          .setDescription("Select a time window")
          .setRequired(true)
          .addChoices(...timeWindowOptions)
      )
      .addBooleanOption((option) =>
        option.setName("brag").setDescription("Show this response publicly")
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.LIST)
      .setDescription("View a list of predictions")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of list you want to browse")
          .addChoices(...listOptions)
          .setRequired(true)
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.SEARCH)
      .setDescription("Search predictions")
      .addStringOption((option) =>
        option
          .setName("keyword")
          .setDescription("A keyword to search by")
          .setRequired(true)
          .setMinLength(1)
      )
  )
  .addSubcommand((command) =>
    command
      .setName(Ndb2Subcommand.LEADERBOARDS)
      .setDescription("View Leaderboard")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of leaderboard you want to see")
          .setRequired(true)
          .addChoices(...leaderboardOptions)
      )
      .addStringOption((option) =>
        option
          .setName("window")
          .setDescription("Select a time window")
          .setRequired(true)
          .addChoices(...timeWindowOptions)
      )
      .addBooleanOption((option) =>
        option.setName("brag").setDescription("Show this response publicly")
      )
  )
  .addSubcommand((group) =>
    group.setName(Ndb2Subcommand.HELP).setDescription("Help with Nostradambot2")
  );

const commands = [predictCommand].map((command) => command.toJSON());

export default commands;
