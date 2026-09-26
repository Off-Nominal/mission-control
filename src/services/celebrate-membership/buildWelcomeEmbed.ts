import { EmbedBuilder, GuildMember } from "discord.js";

export function buildClubWelcomeEmbed(member: GuildMember): EmbedBuilder {
  return new EmbedBuilder()
    .setColor("#3e7493")
    .setTitle(`Welcome to the Off-Nominal Discord, ${member.displayName}!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setDescription(
      "Thanks for subscribing! We're glad you're part of the community."
    )
    .addFields(
      { name: "\u200B", value: "We have two core rules:" },
      {
        name: "1. Don't be mean",
        value: "Teasing is ok, discrimination isn't.",
        inline: true,
      },
      {
        name: "2. There are no dumb questions",
        value: "This community values learning and debate.",
        inline: true,
      },
      {
        name: "\u200B",
        value:
          "You can learn more about the rules as well as some of the bots available to help you by checking out our Welcome Guide in <#782993058866266132>.",
      }
    );
}
