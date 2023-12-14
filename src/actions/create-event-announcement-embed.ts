import {
  GuildScheduledEvent,
  EmbedBuilder,
  time,
  TimestampStyles,
  GuildScheduledEventStatus,
} from "discord.js";

export default function createEventAnnouncementEmbed(
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  type: "new" | "pre" | "thread",
  options?: {
    thumbnail?: string;
  }
): EmbedBuilder {
  const thumbnail =
    options?.thumbnail ||
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1642095232/Discord%20Assets/offnominal_2021-01_w4buun.png";

  let streamValue = "No stream available";
  if (event.entityMetadata && event.entityMetadata.location != "Unavailable") {
    streamValue = `[Event URL](${event.entityMetadata.location})`;
  }

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
          event.scheduledStartAt || new Date(0),
          TimestampStyles.LongDateTime
        )} (time local to you)\n(${time(
          event.scheduledStartAt || new Date(0),
          TimestampStyles.RelativeTime
        )})`,
      },
      {
        name: "Watch here",
        value: streamValue,
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
