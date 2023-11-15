import { EmbedBuilder } from "discord.js";

export default function generateSummaryHelpEmbed() {
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
