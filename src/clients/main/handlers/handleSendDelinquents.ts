import { Message, EmbedBuilder } from "discord.js";
import { roleIds, SpecificRole } from "../../../types/roleEnums";
import fetchGuild from "../../actions/fetchGuild";

export default async function handleSendDelinquents(message: Message) {
  const guild = fetchGuild(message.client);
  const guildMemberManager = guild.members;

  const author = await guildMemberManager.fetch(message.author.id);
  if (!author.roles.cache.has(roleIds[SpecificRole.MODS])) {
    return;
  }

  // Gather Data
  const totalUserCount = guildMemberManager.cache.size;
  const allUsers = await guildMemberManager.list({ limit: 1000 });

  const delinquents = allUsers.filter((member) => {
    const roleChecks = [
      member.roles.cache.has(roleIds[SpecificRole.WEMARTIANS]),
      member.roles.cache.has(roleIds[SpecificRole.MECO]),
      member.roles.cache.has(roleIds[SpecificRole.YOUTUBE]),
      member.roles.cache.has(roleIds[SpecificRole.PREMIUM]),
      member.roles.cache.has(roleIds[SpecificRole.BOTS]),
      member.roles.cache.has(roleIds[SpecificRole.HOSTS]),
      member.roles.cache.has(roleIds[SpecificRole.GUESTS]),
    ];
    return !roleChecks.includes(true);
  });

  const embed = new EmbedBuilder({
    title: "Delinquents",
    description:
      "These are the members who do not have requisite roles in Discord.",
    fields: [
      {
        name: "Total",
        value: `${delinquents.size} deliquent users of ${totalUserCount} total users`,
      },
      {
        name: "List",
        value: delinquents.map((user) => user.displayName).join("\n"),
      },
    ],
  });

  const channel = await author.createDM();
  channel.send({ embeds: [embed] });
}
