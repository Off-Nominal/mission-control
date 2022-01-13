import { GuildScheduledEvent, MessageEmbed } from "discord.js";

export default function createEventAnnouncementEmbed(
  event: GuildScheduledEvent,
  thumbnail: string
): MessageEmbed {
  const timestamp = (event.scheduledStartTimestamp / 1000).toString();

  return new MessageEmbed()
    .setTitle(event.name)
    .setAuthor("🎉 New Live Event!")
    .setDescription(event.description)
    .setThumbnail(thumbnail)
    .addField(
      "Date/Time",
      `<t:${timestamp}:F> (time local to you)\n(<t:${timestamp}:R>)`
    )
    .addFields(
      {
        name: "Watch here",
        value: `[YouTube](${event.entityMetadata.location})`,
        inline: true,
      },
      {
        name: "Get Notified",
        value: `[Discord Event](${event.url})`,
        inline: true,
      }
    );
}
