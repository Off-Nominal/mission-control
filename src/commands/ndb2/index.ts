import { SlashCommandBuilder } from "discord.js";

export enum Ndb2Subcommand {
  NEW = "new",
  VIEW = "view",
  ENDORSE = "endorse",
  UNDORSE = "undorse",
  RETIRE = "retire",
  TRIGGER = "trigger",
  SCORE = "score",
  HELP = "help",
}

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
      .setName(Ndb2Subcommand.SCORE)
      .setDescription("View your Nostradambot Scores")
  );
// .addSubcommand((group) =>
//   group.setName(Ndb2Subcommand.HELP).setDescription("Help with Nostradambot2")
// );

const commands = [predictCommand].map((command) => command.toJSON());

export default commands;
