import axios from "axios";
import { Client, MessageEmbed, TextChannel } from "discord.js";
const Discord = require("discord.js");

export const createSiteChecker = (client: Client, url: string) => {
  let eTag = "";

  const checker = () => {
    axios
      .head(url)
      .then((res) => {
        let message = "eTag matches, carry on";
        let messageNecessary = false;

        if (res.status !== 200) {
          message = `There was an error reaching the Starship site. Error code ${res.status}`;
        } else if (eTag === "") {
          eTag = res.headers.etag;
          message = `Setting eTag to ${res.headers.etag}`;
        } else if (eTag !== res.headers.etag) {
          message = "eTag does not match, sending Discord message";
          messageNecessary = true;
        }

        if (!messageNecessary) {
          return message;
        } else {
          const embed: MessageEmbed = new Discord.MessageEmbed();
          embed
            .setColor("#3e7493")
            .setTitle(`FYI - there has been an update to the Starship website.`)
            .setURL("https://www.spacex.com/vehicles/starship/");

          const messageSent = client.channels
            .fetch("781235493118672949")
            .then((channel) => (channel as TextChannel).send(embed))
            .finally(() => {
              const message = "eTag does not match, sending Discord message";
              return message;
            });
        }
      })
      .then((message) => {
        return console.log(message);
      })
      .catch((err) => {
        return console.log(err);
      });
  };
  return checker;
};
