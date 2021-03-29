import axios from "axios";
import { Client, MessageEmbed, TextChannel } from "discord.js";
const Discord = require("discord.js");

export const createSiteChecker = (
  client: Client,
  url: string,
  channelId: string
) => {
  let eTag = "";

  const checker = async () => {
    let response;

    try {
      response = await axios.head(url);
    } catch (err) {
      console.error(`There was an error reaching the Starship site.`);
      console.error(err);
    }

    if (eTag === "") {
      eTag = response.headers.etag;
      console.log(`Site checker is now monitoring ${url}`);
      console.log(`ETag for ${url} is ${eTag}`);
    } else if (eTag !== response.headers.etag) {
      console.log(
        `Site checker detected a change at ${url}. Sending Discord message.`
      );

      const embed: MessageEmbed = new Discord.MessageEmbed();
      embed
        .setColor("#3e7493")
        .setTitle(`FYI - there has been an update to the Starship website.`)
        .setURL(url);

      try {
        const channel = await client.channels.fetch(channelId);
        await (channel as TextChannel).send(embed);
        console.log(`Discord successfully notified of change to ${url}`);
        eTag = response.headers.etag;
      } catch (err) {
        console.error(err);
      }
    }
  };
  return checker;
};
