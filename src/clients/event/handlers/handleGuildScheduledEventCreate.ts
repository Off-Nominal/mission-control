import { Collection, GuildMember, GuildScheduledEvent } from "discord.js";
import { Client } from "pg";
import userQueries from "../../../queries/users";
import createEventAnnouncementEmbed from "../actions/createEventAnnouncementEmbed";

const offnomThumb =
  "https://res.cloudinary.com/dj5enq03a/image/upload/v1642095232/Discord%20Assets/offnominal_2021-01_w4buun.png";

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

    const embed = createEventAnnouncementEmbed(event, offnomThumb);

    subscribers.forEach(async (subscriber) => {
      try {
        const dmChannel = await subscriber.createDM();
        await dmChannel.send({ embeds: [embed] });
      } catch (err) {
        console.error(
          `Error sending new event notificaiton to ${subscriber.displayName}`
        );
        console.error(err);
      }
    });
  };
}
