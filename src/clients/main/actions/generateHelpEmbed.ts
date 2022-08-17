import { EmbedBuilder } from "discord.js";

export const generateHelpEmbed = () => {
  return new EmbedBuilder()
    .setTitle("How do you use these Discord bots anyway?")
    .setDescription(
      "Many bots have their own help commands. Here's a list to call them up. Consider sending them a direct message with this command in order to keep the channel free of clutter."
    )
    .addFields([
      { name: "Content", value: "`/content help`", inline: true },
      { name: "Book Club", value: "`/bookclub help`", inline: true },
      { name: "NostradamBot", value: "`!ndb help`", inline: true },
      { name: "Launch Alerts", value: "`!l help`", inline: true },
      { name: "Terminal Count", value: "`!tc help`", inline: true },
      { name: "Tracking Station", value: "`!map help`", inline: true },
      {
        name: "Shunt - Move a conversation to a new channel (with option for thread)",
        value:
          "`/shunt [channel] [topic] [thread?]` - Request a conversation be moved to another channel.",
      },
      {
        name: "Poll - poll the discord with a question",
        value: "`/poll ask` with 2-10 options. Type `/poll help` for more.",
      },
      {
        name: "Mars Time - Get the local time for any spacecraft on Mars",
        value:
          "`/marstime` to get Mars Coordinated Time, or add `spacecraft` option and select a vehicle from the list.",
      },
      {
        name: "Summary Bot - get a bot-interpreted summary of channel activity",
        value:
          "`/summary` with a `duration` integer in hours. Type `/summary help` for more info.",
      },
    ]);
};
