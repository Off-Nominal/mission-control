import { Collection, GuildMember, GuildScheduledEvent } from "discord.js";
import { Client } from "pg";
import userQueries from "../../../queries/users";
import createEventAnnouncementEmbed from "../actions/createEventAnnouncementEmbed";

export default function generateGuildScheduledEventCreate(db: Client) {
  const { fetchNewEventSubscribers } = userQueries(db);

  return async function handleGuildScheduledEventCreate(
    event: GuildScheduledEvent
  ) {
    const query = await fetchNewEventSubscribers();
    const memberIds = query.rows.map((user) => user.discord_id);
    let subscribers: Collection<string, GuildMember>;

    try {
      subscribers = await event.guild.members.fetch({ user: memberIds });
    } catch (err) {
      console.error("Failed to fetch User subscriber list on new event create");
      return console.error(err);
    }

    const content = `New Event: ${event.name}\n\nThere is a new event in the Off-Nominal Discord!\n\nYou are receiving this DM because you subscribed via the \`/events\` command. If you want to change this, you can update your settings with \`/events subscribe\` or \`/events unsubscribe\` (note: This must be done in the server and not via DM.)`;
    const embed = createEventAnnouncementEmbed(event, "new");

    subscribers.forEach(async (subscriber) => {
      try {
        const dmChannel = await subscriber.createDM();
        await dmChannel.send({ content, embeds: [embed] });
      } catch (err) {
        console.error(
          `Error sending new event notificaiton to ${subscriber.displayName}`
        );
        console.error(err);
      }
    });
  };
}
