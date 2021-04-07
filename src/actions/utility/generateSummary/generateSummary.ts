import { sub } from "date-fns";
import { Collection, Message, MessageEmbed } from "discord.js";
import { fetchMessages } from "./helpers/fetchMessages";
import { getTwitter } from "./filters/getTwitter";
import { getNews } from "./filters/getNews";
import { getDiscussion } from "./filters/getDiscussion";
import { getYouTube } from "./filters/getYouTube";
import { generateLinkSummary } from "./reportFieldGenerators/generateLinkSummary";
import { generateTwitterSummary } from "./reportFieldGenerators/generateTwitterSummary";
import { generateDiscussionSummary } from "./reportFieldGenerators/generateDiscussionSummary";

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

  try {
    loadingMsg = await message.channel.send("Generating Summary Report...");
  } catch (err) {
    console.error("Loading message failed to send to Discord.");
  }

  let messages: Collection<string, Message>;
  const now = new Date();
  const timeLimit = sub(now, { hours: hourLimit }); // The oldest Date a message can be to fit within specified window

  try {
    messages = await fetchMessages(message, timeLimit);
  } catch (err) {
    console.error("Error fetching messages from Discord API.");
    console.error(err);
  }

  //generate collections for summary sections
  const twitterCollection = getTwitter(messages);
  const newsCollection = getNews(messages);
  const discussionCollection = getDiscussion(messages);
  const youTubeCollection = getYouTube(messages);

  const newsReport = generateLinkSummary(newsCollection, hourLimit, {
    type: "news",
  });
  const twitterReport = await generateTwitterSummary(
    twitterCollection,
    hourLimit
  );
  const discussionReport = await generateDiscussionSummary(
    discussionCollection,
    hourLimit
  );
  const youTubeReport = generateLinkSummary(youTubeCollection, hourLimit, {
    type: "youtube",
  });

  loadingMsg?.delete();

  message.channel.send(newsReport);
  message.channel.send(twitterReport);
  message.channel.send(discussionReport);
  message.channel.send(youTubeReport);
};
