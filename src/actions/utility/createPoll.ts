import { Message, MessageEmbed } from "discord.js";
import { clip } from "../../helpers/clip";
import { parseCommands } from "../../helpers/parseCommands";

export const createPoll = (message: Message) => {
  const [prefix, ...rest] = parseCommands(message, false);

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

  if (rest[0] === "help") {
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

    message.channel.send(embed);
  } else if (rest[0].startsWith("{")) {
    const endIndex = rest.findIndex((el) => el.endsWith("}"));
    const pollTitle = clip(rest.slice(0, endIndex + 1).join(" "), 1);
    const options = rest.slice(endIndex + 1);

    const embed = new MessageEmbed();
    embed.setTitle(pollTitle).setDescription(
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
  } else {
    const pollTitle = rest.join(" ");
    message.react("👍");
    message.react("👎");
    message.react("🤷");
  }
};
