import { SlashCommandBuilder } from "discord.js";

// Predict
const predictCommand = new SlashCommandBuilder()
  .setName("predict")
  .setDescription("Work with Nostradambot2 Predictions")
  .addSubcommand((command) =>
    command.setName("new").setDescription("Create a new Prediction")
  )
  .addSubcommand((command) =>
    command
      .setName("view")
      .setDescription("Create a new Prediction")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("Prediction ID").setRequired(true)
      )
  )
  .addSubcommand((command) =>
    command
      .setName("endorse")
      .setDescription("Endorse a Prediction")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("Prediction ID").setRequired(true)
      )
  )
  .addSubcommand((command) =>
    command
      .setName("undorse")
      .setDescription("Undorse a Prediction")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("Prediction ID").setRequired(true)
      )
  )
  .addSubcommand((command) =>
    command
      .setName("cancel")
      .setDescription("Cancel a Prediction you just made")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("Prediction ID").setRequired(true)
      )
  )
  .addSubcommand((command) =>
    command.setName("score").setDescription("View your Nostradambot Scores")
  )
  .addSubcommand((group) =>
    group.setName("help").setDescription("Help with Nostradambot2")
  );

const commands = [predictCommand].map((command) => command.toJSON());

export default commands;
