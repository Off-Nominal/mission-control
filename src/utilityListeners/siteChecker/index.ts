import axios from "axios";
import { Client, MessageEmbed, TextChannel } from "discord.js";
const Discord = require("discord.js");

export const createSiteChecker = (client: Client, url: string) => {
  let eTag = "";

  const checker = async () => {
    let response;

    try {
      response = await axios.head(url);
    } catch (err) {
      console.error(err);
    }

    let message = "eTag matches, carry on";

    if (response.status !== 200) {
      message = `There was an error reaching the Starship site. Error code ${response.status}`;
    } else if (eTag === "") {
      eTag = response.headers.etag;
      message = `Setting eTag to ${response.headers.etag}`;
    } else if (eTag !== response.headers.etag) {
      message = "eTag does not match, sending Discord message";

      const embed: MessageEmbed = new Discord.MessageEmbed();
      embed
        .setColor("#3e7493")
        .setTitle(`FYI - there has been an update to the Starship website.`)
        .setURL(url);

      try {
        const channel = await client.channels.fetch("754432168293433354");
        await (channel as TextChannel).send(embed);
      } catch (err) {
        console.error(err);
      }
    }

    return console.log(message);
  };
  return checker;
};
