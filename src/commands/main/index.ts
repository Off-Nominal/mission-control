import { SlashCommandBuilder } from "discord.js";
import { spacecraftData } from "../../clients/main/actions/marstime/constants";

// Help
const helpCommand = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Get help with Discord Bots");

// Shunt
const shuntCommand = new SlashCommandBuilder()
  .setName("shunt")
  .setDescription("Move a conversation to a new channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Destination channel")
      .setRequired(true)
      .addChannelType(0)
  )
  .addStringOption((option) =>
    option
      .setName("topic")
      .setDescription("The conversation topic you're shunting")
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("thread").setDescription("Target your shunt to a new Thread")
  );

// Marstime
const marstimeCommand = new SlashCommandBuilder()
  .setName("marstime")
  .setDescription("Get the current time on Mars")
  .addStringOption((option) =>
    option
      .setName("spacecraft")
      .setDescription("Select a specific spacecraft")
      .addChoices(
        Object.keys(spacecraftData).map<[string, string]>((spacecraft) => [
          spacecraftData[spacecraft].name,
          spacecraft,
        ])
      )
  );

// Summary
const summaryCommand = new SlashCommandBuilder()
  .setName("summary")
  .setDescription("Summarize activity in the channel over a set time period")
  .addSubcommand((command) =>
    command
      .setName("duration")
      .setDescription(
        "Summarize activity in the channel over a set time period"
      )
      .addIntegerOption((option) =>
        option
          .setName("duration")
          .setDescription(
            "Number of hours to summarize back from now (max 24)."
          )
          .setRequired(true)
      )
  )
  .addSubcommand((group) =>
    group.setName("help").setDescription("Help with Summary Bot")
  );

// Poll
const pollCommand = new SlashCommandBuilder()
  .setName("poll")
  .setDescription("Poll the community")
  .addSubcommand((command) =>
    command
      .setName("ask")
      .setDescription("Ask a poll of the community")
      .addStringOption((option) =>
        option
          .setName("question")
          .setDescription("The question you want to ask")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("choice-1")
          .setDescription("Answer option 1")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("choice-2")
          .setDescription("Answer option 2")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("choice-3").setDescription("Answer option 3")
      )
      .addStringOption((option) =>
        option.setName("choice-4").setDescription("Answer option 4")
      )
      .addStringOption((option) =>
        option.setName("choice-5").setDescription("Answer option 5")
      )
      .addStringOption((option) =>
        option.setName("choice-6").setDescription("Answer option 6")
      )
      .addStringOption((option) =>
        option.setName("choice-7").setDescription("Answer option 7")
      )
      .addStringOption((option) =>
        option.setName("choice-8").setDescription("Answer option 8")
      )
      .addStringOption((option) =>
        option.setName("choice-9").setDescription("Answer option 9")
      )
      .addStringOption((option) =>
        option.setName("choice-10").setDescription("Answer option 10")
      )
  )
  .addSubcommand((command) =>
    command.setName("help").setDescription("Get help with polls")
  );

const commands = [
  helpCommand,
  shuntCommand,
  marstimeCommand,
  summaryCommand,
  pollCommand,
].map((command) => command.toJSON());

export default commands;
