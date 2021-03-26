import axios from "axios";
import { MessageEmbed, TextChannel } from "discord.js";
const Discord = require("discord.js");

export const createSiteChecker = (client, url) => {
  let eTag = "";

  const checker = () => {
    axios.head(url).then((res) => {
      if (eTag === "") {
        console.log("Setting eTag to ", res.headers.etag);
        eTag = res.headers.etag;
        return;
      } else if (eTag !== res.headers.etag) {
        console.log("eTag does not match, sending Discord message");
        const embed: MessageEmbed = new Discord.MessageEmbed();

        embed
          .setColor("#3e7493")
          .setTitle(`FYI - there has been an update to the Starship website.`)
          .setURL("https://www.spacex.com/vehicles/starship/");

        return client.channels
          .fetch("781235493118672949")
          .then((channel) => (channel as TextChannel).send(embed));
      }
      return console.log("eTag matches, carry on");
    });
  };
  return checker;
};
