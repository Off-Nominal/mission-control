const Discord = require('discord.js');
import { Message, MessageEmbed } from 'discord.js';

export const handleHelpCommand = (message: Message) => {
  const embed: MessageEmbed = new Discord.MessageEmbed();

  embed
    .setColor('#3e7493')
    .setTitle('Book Club Bot Help')
    .setDescription(
      'Book Club Bot can serve you recommendations using the "recommend" command.'
    )
    .addFields(
      {
        name: '!bc recommend random',
        value: 'Gives you a random book from our collection.',
      },
      {
        name: '!bc recommend best',
        value:
          'Gives you the book with the highest user rating in the last 60 days.',
      },
      {
        name: '!bc recommend favourite',
        value: `Gives you the book with the most community favourites in the last 60 days. And yes, that's favourite with a "u". :flag_ca:`,
      }
    );
  message.channel.send(embed);
};
