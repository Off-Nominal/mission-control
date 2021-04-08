import { Message, MessageEmbed } from "discord.js";

export const sendSummaryHelp = (message: Message) => {
  const embed = new MessageEmbed();

  embed
    .setTitle("Getting channel summaries [BETA]")
    .setDescription(
      "You can generate a summary of activity in a channel by calling the `!summary` command. The summary will be sent to you via a DM."
    )
    .addFields([
      {
        name: "Specify time window",
        value:
          "By default, `!summary` will look back 8 hours in its report. You can change this by add a number after the command, up to a maximum of 24 hours. Example: `!summary 12` returns activity from the last twelve hours.",
      },
      {
        name: "Force in channel",
        value:
          "By default, the summary is sent via DM. You can force it to report inside the channel you call it by adding the `here` parameter after the time window. Example: `!summary 8 here` will create a report for the last 8 hours and post it in to the channel where you call it.",
      },
    ]);

  message.channel.send(embed);
};
