import { sub } from "date-fns";
import { Collection, Message, MessageEmbed } from "discord.js";
import { fetchMessages } from "./helpers/fetchMessages";
import { getTwitter } from "./filters/getTwitter";
import { getNews } from "./filters/getNews";
import { getDiscussion } from "./filters/getDiscussion";
import { generateNewsReport } from "./reportFieldGenerators/generateNewsReport";

export const generateSummary = async (
  message: Message,
  hourLimit: number = 8
) => {
  if (hourLimit > 24) {
    return message.channel.send(
      "In order to maintain order, please limit summary reports to last 24 hours"
    );
  }

  let loadingMsg: Message;
  let messages: Collection<string, Message>;

  const now = new Date();
  const timeLimit = sub(now, { hours: hourLimit }); // The oldest Date a message can be to fit within specified window

  try {
    loadingMsg = await message.channel.send("Generating Summary Report...");
  } catch (err) {
    console.error("Loading message failed to send to Discord.");
  }

  try {
    messages = await fetchMessages(message, timeLimit);
  } catch (err) {
    console.error("Error fetching messages to generate summary report.");
    console.error(err);
  }

  //generate collections for summary sections
  const twitterCollection = getTwitter(messages);
  const newsCollection = getNews(messages);
  const discussionCollection = getDiscussion(messages);

  const embed = new MessageEmbed();

  loadingMsg?.delete();

  embed
    .setTitle("Summary of Today")
    .setDescription(
      `News items posted in this channel in the last ${hourLimit} hours.`
    )
    .addFields(generateNewsReport(newsCollection));

  message.channel.send(embed);
};
