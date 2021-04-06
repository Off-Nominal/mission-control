import { Message, MessageEmbed } from "discord.js";
import { clip } from "../../helpers/clip";
import { parseCommands } from "../../helpers/parseCommands";
import { parsePoll } from "../../helpers/parsePoll";

export const createPoll = (message: Message) => {
  const [prefix, firstParam] = parseCommands(message, false);

  if (firstParam === "help") {
    const embed = new MessageEmbed();

    embed
      .setTitle("Creating polls")
      .setDescription(
        "Using the Discord helper, you can create simple polls or complex polls."
      )
      .addField(
        "Simple Polls",
        "Simple polls allow for 👍, 👎, or 🤷 reactions to a simple question. Call it by using `!poll [poll question]`, like `!poll Do you like beans?`."
      )
      .addField(
        "Complex Polls",
        "Complex polls allow for multiple options. Call it using `!poll {question} [Option A] [Option B] [Option C] ...`. You can add up to 20 options. Example: `!poll {What bean is best?} [Kidney Bean] [Black Bean] [Pinto Bean]`."
      );

    return message.channel.send(embed);
  }

  if (!firstParam.startsWith("{")) {
    message.react("👍");
    message.react("👎");
    message.react("🤷");
    return;
  }

  const letters = [
    "🇦",
    "🇧",
    "🇨",
    "🇩",
    "🇪",
    "🇫",
    "🇬",
    "🇭",
    "🇮",
    "🇯",
    "🇰",
    "🇱",
    "🇲",
    "🇳",
    "🇴",
    "🇵",
    "🇶",
    "🇷",
    "🇸",
    "🇹",
  ];

  const [question, ...options] = parsePoll(message);

  if (options.length > 20) {
    return message.channel.send(
      "Complex polls may only have up to 20 options, you monster."
    );
  }

  const embed = new MessageEmbed();
  embed.setTitle("Poll: " + question).setDescription(
    options
      .map((option, index) => {
        return `${letters[index]} - ${clip(option, 1)}`;
      })
      .join("\n\n")
  );

  message.channel.send(embed).then((pollMsg) => {
    for (let i = 0; i < options.length; i++) {
      pollMsg.react(letters[i]);
    }
  });
};
