import { GuildScheduledEvent, MessageEmbed } from "discord.js";

export default function createEventAnnouncementEmbed(
  event: GuildScheduledEvent,
  type: "new" | "pre",
  options?: {
    thumbnail?: string;
  }
): MessageEmbed {
  const timestamp = Math.floor(event.scheduledStartTimestamp / 1000).toString();
  const thumbnail =
    options?.thumbnail ||
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1642095232/Discord%20Assets/offnominal_2021-01_w4buun.png";
  const author =
    type === "pre" ? "📅 Event Happening Soon!" : "🎉 New Live Event!";

  return new MessageEmbed()
    .setTitle(event.name)
    .setAuthor({ name: author })
    .setDescription(event.description || "No event description provided.")
    .setThumbnail(thumbnail)
    .addField(
      "Date/Time",
      `<t:${timestamp}:F> (time local to you)\n(<t:${timestamp}:R>)`
    )
    .addFields(
      {
        name: "Watch here",
        value: `[Event URL](${event.entityMetadata.location})`,
        inline: true,
      },
      {
        name: "Get Notified",
        value: `[Discord Event](${event.url})`,
        inline: true,
      }
    );
}
