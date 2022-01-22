import { add } from "date-fns";
import { Interaction } from "discord.js";
import { Client } from "pg";
import { setEventSubscriptions } from "../../../queries/users";
import createDiscordEvent from "../actions/createDiscordEvent";

const livechatChannelID = process.env.LIVECHATCHANNELID;

export default async function handleInteractionCreate(
  interaction: Interaction,
  db: Client
) {
  if (!interaction.isCommand()) return;

  const { options } = interaction;
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
        content: `Request receieved! Your event "${name}" will start imminently.`,
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

  if (subCommand === "subscribe") {
    const subscribe = options.getBoolean("event-start");
    const preEvent = options.getInteger("pre-event");
    const discordId = interaction.user.id;

    if (subscribe === null && preEvent === null) {
      return await interaction.reply({
        content:
          "No parameters set, so no changes to your subscription settings.",
      });
    }

    try {
      const userSettings = await setEventSubscriptions(
        db,
        discordId,
        subscribe,
        preEvent
      );
      const { auto_subscribe, pre_notification } = userSettings.rows[0];
      await interaction.reply({
        content: `Subscription updated! Your current subscription settings are now:\nAuto-subscribe to new Events: ${
          auto_subscribe ? "Enabled" : "Disabled"
        }\nPre-Event notification schedule: ${
          pre_notification
            ? pre_notification + " minutes before the event"
            : "Disabled"
        }`,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content:
          "Something went wrong setting your subscriptions. Please let Jake know!",
        ephemeral: true,
      });
    }
  }
}
