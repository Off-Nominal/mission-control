import { Message } from "discord.js";
import { generateHelpEmbed } from "../actions/generateHelpEmbed";
import {
  getRecommendation,
  RecommendCommand,
} from "../actions/getRecommendation";
import { parseCommands } from "../../../helpers/parseCommands";

const BASEURL = process.env.BASEURL;

enum AllowedPrefix {
  BC = "!bc",
}

export default async function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const [prefix, command, type] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  if (command === `recommend`) {
    if (!Object.values(RecommendCommand).includes(type as RecommendCommand)) {
      message.channel.send({
        content: "That recommend type (${incorrectArg}) is not supported",
      });
    }

    try {
      const slug = await getRecommendation(type as RecommendCommand);
      message.channel.send({ content: `${BASEURL}/books/${slug}` });
    } catch (err) {
      message.channel.send({
        content: "There was an error contacting the Space Book Club API.",
      });
    }
  } else if (command === "help") {
    message.channel.send({ embeds: [generateHelpEmbed()] });
  } else {
    message.channel.send({
      content: `Command not recognized. If you're stuck, try \`!bc help\` to find your way.`,
    });
  }
}
