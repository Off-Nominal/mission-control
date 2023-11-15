import { Message, EmbedBuilder } from "discord.js";
import fetchGuild from "../../../utilities/fetchGuild";
import mcconfig from "../../../mcconfig";

export default async function handleSendDelinquents(message: Message) {
  const guild = fetchGuild(message.client);
  const guildMemberManager = guild.members;

  const author = await guildMemberManager.fetch(message.author.id);
  if (!author.roles.cache.has(mcconfig.discord.roles.mods)) {
    return;
  }

  // Gather Data
  const totalUserCount = guildMemberManager.cache.size;
  const allUsers = await guildMemberManager.list({ limit: 1000 });

  const delinquents = allUsers.filter((member) => {
    const roleChecks = [
      member.roles.cache.has(mcconfig.discord.roles.wemartians),
      member.roles.cache.has(mcconfig.discord.roles.meco),
      member.roles.cache.has(mcconfig.discord.roles.youtube),
      member.roles.cache.has(mcconfig.discord.roles.premium),
      member.roles.cache.has(mcconfig.discord.roles.bots),
      member.roles.cache.has(mcconfig.discord.roles.hosts),
      member.roles.cache.has(mcconfig.discord.roles.guests),
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
