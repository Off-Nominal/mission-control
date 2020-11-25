import { GuildMember, TextChannel, MessageEmbed } from 'discord.js';
const Discord = require('discord.js');

export const welcomeUser = (member: GuildMember) => {
  console.log('function fired for guildMemberAdd');
  console.log(member);
  const channel = member.guild.channels.cache.find(
    (ch) => ch.name === 'general'
  ) as TextChannel;

  console.log(channel);

  if (!channel) return;

  console.log('The new member is', member);
  console.log('The target channel is', channel);

  const embed: MessageEmbed = new Discord.MessageEmbed();

  embed
    .setColor('#3e7493')
    .setTitle(`Welcome to the Off-Nominal Discord, ${member.displayName}!`)
    .setThumbnail(member.user.avatarURL())
    .setDescription('Enjoy the flood of welcomes you are about to receive!')
    .addFields(
      { name: '\u200B', value: 'We have two core rules:' },
      {
        name: "1. Don't be mean",
        value: "Teasing is ok, discrimination isn't.",
        inline: true,
      },
      {
        name: '2. There are no dumb questions',
        value: 'This community values learning and debate.',
        inline: true,
      },
      {
        name: '\u200B',
        value: `You can learn more about the rules as well as some of the bots available to help you by checking out our [Welcome Guide](https://discord.offnominal.space 'The Off-Nominal Welcome Guide').`,
      }
    );

  channel.send(`Attention <@${member.user.id}>!`, { embed });
};
