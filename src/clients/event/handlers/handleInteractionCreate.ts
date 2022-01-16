import { add } from "date-fns";
import { Interaction } from "discord.js";
import createDiscordEvent from "../actions/createDiscordEvent";

const livechatChannelID = process.env.LIVECHATCHANNELID;

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  if (!interaction.isCommand()) return;

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === "start") {
    const url = options.getString("url", true);
    const duration = options.getInteger("duration", true);
    const name = options.getString("title");

    // Discord events have to be in the future, so this just sets it 2 seconds into the future
    // Hopefully this accounts for rqeuest time from user to bot to Discord
    const scheduledStartTime = add(new Date(), { seconds: 2 });

    try {
      await createDiscordEvent(
        {
          name,
          scheduledStartTime,
          scheduledEndTime: add(scheduledStartTime, { minutes: duration }),
          privacyLevel: "GUILD_ONLY",
          entityType: "EXTERNAL",
          description: `Come hang out in <#${livechatChannelID}> and watch the event with us!`,
          entityMetadata: { location: url },
          reason: "User initiated slash command",
        },
        interaction.client
      );

      await interaction.reply({
        content: "Request receieved! The event will start imminently.",
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        content:
          "Something went wrong with the event creation. Please let Jake know and try again!",
        ephemeral: true,
      });
      console.error(err);
    }
  }
}
