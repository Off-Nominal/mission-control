import { EmbedBuilder, User } from "discord.js";
import { Providers } from "../../providers";
import { ReportGenerator } from "./ReportGenerator";

function generateSummaryHelpEmbed() {
  return new EmbedBuilder()
    .setTitle("Getting channel summaries")
    .setDescription(
      "You can generate a summary of activity in a channel by calling the `/summary` command. The summary will be sent to you via a DM.\n\nSummaries will include a word cloud of the discussion in the channel as well as key information from posted news articles, youtube videos and tweets."
    )
    .addFields([
      {
        name: "Duration",
        value:
          "Add a number (in hours up to a maximum of 24 hours) for the report to look back. Example: `/summary duration 12` returns activity from the last twelve hours.",
      },
    ]);
}

export default function ChannelSummary({ helperBot }: Providers) {
  const reportGenerator = new ReportGenerator();

  helperBot.on("interactionCreate", (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "summary") return;

    if (subCommand === "help") {
      interaction.reply({ embeds: [generateSummaryHelpEmbed()] });
      return;
    }

    if (subCommand === "duration") {
      reportGenerator.handleReportRequest(interaction);
      return;
    }
  });

  helperBot.on("messageReactionAdd", async (messageReact, user) => {
    if (user.bot) return;

    // When the bot restarts, old messages are partials and cached.
    // If a user requests a report from a message prior to when the bot booted,
    // it must fetch the full message to get its Id
    if (messageReact.partial) {
      try {
        await messageReact.fetch();
      } catch (err) {
        console.error("Error fetching message partial");
      }
    }

    try {
      const completeUser = await user.fetch();
      if (
        messageReact.emoji.toString() === "📩" &&
        messageReact.message.embeds[0]?.title === "Channel Summary Report"
      ) {
        reportGenerator.handleSendRequest(
          completeUser,
          messageReact.message.id
        );
      }
    } catch (err) {
      console.error("Error fetching user partial");
    }
  });
}
