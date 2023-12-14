import {
  GuildScheduledEvent,
  EmbedBuilder,
  time,
  TimestampStyles,
} from "discord.js";

export default function createEventAnnouncementEmbed(
  event: GuildScheduledEvent,
  type: "new" | "pre" | "thread",
  options?: {
    thumbnail?: string;
  }
): EmbedBuilder {
  const thumbnail =
    options?.thumbnail ||
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1642095232/Discord%20Assets/offnominal_2021-01_w4buun.png";

  const embed = new EmbedBuilder({
    title: event.name,
    description: event.description || "No event description provided.",
    thumbnail: {
      url: thumbnail,
    },
    fields: [
      {
        name: "Discord Event Date/Time (15 mins before T-0)",
        value: `${time(
          event.scheduledStartAt,
          TimestampStyles.LongDateTime
        )} (time local to you)\n(${time(
          event.scheduledStartAt,
          TimestampStyles.RelativeTime
        )})`,
      },
      {
        name: "Watch here",
        value:
          event.entityMetadata.location === "Unavailable"
            ? "No stream available"
            : `[Event URL](${event.entityMetadata.location})`,
        inline: true,
      },
      {
        name: "Get Notified",
        value: `[Discord Event](${event.url})`,
        inline: true,
      },
    ],
  });

  if (type === "new" || type === "pre") {
    const author =
      type === "new" ? "🎉 New Live Event!" : "📅 Event Happening Soon!";

    embed.setAuthor({
      name: author,
    });
  }

  if (event.image) {
    embed.setImage(
      `https://cdn.discordapp.com/guild-events/${event.id}/${event.image}.png?size=512`
    );
  }

  return embed;
}
