import { Message, MessageEmbed } from "discord.js";
import { parseCommands } from "../../helpers/parseCommands";
import { parsePoll } from "../../helpers/parsePoll";

export const createPoll = (message: Message) => {
  const [prefix, firstParam] = parseCommands(message, false);

  const send = (text: string | MessageEmbed) => {
    return message.channel.send(text);
  };

  if (firstParam === "help") {
    const embed = new MessageEmbed();

    embed
      .setTitle("Creating polls")
      .setDescription(
        "Using the Discord helper, you can create simple polls or complex polls."
      )
      .addField(
        "Simple Polls",
        "Simple polls allow for 👍, 👎, or 🤷 reactions to a simple question. Call it by using `!poll question`, like `!poll Do you like beans?`."
      )
      .addField(
        "Complex Polls",
        "Complex polls allow for multiple options. Call it using `!poll {question} [Option A] [Option B] [Option C] ...`. You can add up to 20 options. Example: `!poll {What bean is best?} [Kidney Bean] [Black Bean] [Pinto Bean]`."
      );

    return send(embed);
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

  const { question, options } = parsePoll(message);

  if (options.length > 20) {
    return send("Complex polls may only have up to 20 options, you monster.");
  }

  if (options.length === 0) {
    return send(
      "Error with your poll question or options. Check for missing `{`, `}`, `[`, `]` or enter `!poll help` for more assitance."
    );
  }

  const optionsString = options
    .map((option, index) => `${letters[index]} - ${option}`)
    .join("\n\n");

  const embed = new MessageEmbed();

  embed.setTitle("Poll: " + question).setDescription(optionsString);

  send(embed)
    .then((pollMsg) => {
      const promises = [];

      for (let i = 0; i < options.length; i++) {
        promises.push(pollMsg.react(letters[i]));
      }

      return Promise.all(promises);
    })
    .catch((err) => {
      console.error("Problem creating poll.");
      console.error(err);
      send(
        "Sorry, I had some trouble making that poll. Please tell Jake about this."
      );
    });
};
