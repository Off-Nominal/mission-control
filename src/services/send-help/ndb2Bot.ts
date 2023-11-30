import { EmbedBuilder, Interaction } from "discord.js";

export function sendNdb2Help(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (commandName !== "predict" || subCommand !== "help") {
    return;
  }

  const embed = new EmbedBuilder({
    title: "NDB2 Help",
    description:
      "Here are some short descriptions of commands you can do in NDB2! All commands are initiated using the slash command format, by typing `/predict`.",
    fields: [
      {
        name: "Create a new Prediction",
        value:
          "`/predict new` - Open the New Prediction window to log your best guess.",
      },
      {
        name: "View Prediction",
        value:
          "`/predict view [id]` - View the details of a specific prediction using its id. Example: `/predict view 100`.",
      },
      {
        name: "Retire Prediction",
        value:
          "`/predict retire [id]` - Retire a prediction you just made (if the date or text is wrong). Must be done within 12 hours of creation. Example: `/predict retire 100`.",
      },
      {
        name: "Trigger Prediction",
        value:
          "`/predict trigger [id]` - Trigger a prediction if it is ready to be judged now. NDB2 will automatically trigger predictions when their due date arrives, but you can use this to trigger it early if we already know the results. Example: `/predict trigger 100`. **Optionally**, you may add an effective close date for your trigger, indicating the date we knew the results. This is useful for triggering a prediction 'in the past' when we forget to trigger it at the time. Example: `/predict trigger 100 2020-05-09",
      },
      {
        name: "List Predictions",
        value:
          "`/predict list [type]` - View a list of predictions by a certain type. Currently supported is 'Recently Made' for ten most recently made predictions and 'Upcoming Judgements' for next ten predictions that are soon to trigger. Example: `/predict list upcoming`.",
      },
      {
        name: "Search Predictions",
        value:
          "`/predict search [keyword]` - Get a list of top ten matches to a keyword search. Example: `/predict search starship`.",
      },
      {
        name: "View Score",
        value:
          "`/predict score [optional: brag]` - View your own all-time scores and stats, including points, predictions, bets and votes. Responses are private unless the optional brag option is set to true. Example: `/predict score`.",
      },
      {
        name: "View Leaderboards",
        value:
          "`/predict leaderboards [type]` - View the leaderboards (top 10 players) in three categories. Currently supported are Most Points, Most Successful Predictions, and Most Successful bets. Responses are private unless the optional brag option is set to true. Example: `/predict leaderboards points`.",
      },
    ],
  });

  interaction.reply({ embeds: [embed] });
}
