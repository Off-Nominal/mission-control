import { sub } from "date-fns";
import {
  APIMessageContentResolvable,
  Collection,
  Message,
  TextChannel,
} from "discord.js";
import { fetchMessages } from "./helpers/fetchMessages";
import { getTwitter } from "./filters/getTwitter";
import { getNews } from "./filters/getNews";
import { getDiscussion } from "./filters/getDiscussion";
import { getYouTube } from "./filters/getYouTube";
import { generateLinkSummary } from "./reportFieldGenerators/generateLinkSummary";
import { generateTwitterSummary } from "./reportFieldGenerators/generateTwitterSummary";
import { generateDiscussionSummary } from "./reportFieldGenerators/generateDiscussionSummary";
import { MessageOptions } from "discord.js";
import { MessageAdditions } from "discord.js";

export const generateSummary = async (
  message: Message,
  hourLimit: number = 8,
  forceChannel: boolean = false
) => {
  const dmChannel = await message.author.createDM();

  const send = (
    contents:
      | APIMessageContentResolvable
      | (MessageOptions & { split?: false })
      | MessageAdditions
  ) => {
    if (forceChannel) {
      return message.channel.send(contents);
    } else {
      return dmChannel.send(contents);
    }
  };

  if (hourLimit > 24) {
    return send(
      "In order to maintain order, please limit summary reports to last 24 hours"
    );
  }

  let loadingMsg: Message;

  try {
    loadingMsg = await send(
      `Generating Summary Report for channel <#${message.channel.id}>...`
    );
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

  let messageDeleted = false;
  let noContent = true;

  const deleteLoadingMsg = async () => {
    if (messageDeleted) {
      return;
    }

    if (forceChannel) {
      await loadingMsg?.delete();
      messageDeleted = true;
    }
  };

  if (newsCollection.size > 0) {
    const newsReport = generateLinkSummary(newsCollection, hourLimit, {
      type: "news",
    });
    deleteLoadingMsg();
    noContent = false;
    send(newsReport);
  }

  if (youTubeCollection.size > 0) {
    const youTubeReport = generateLinkSummary(youTubeCollection, hourLimit, {
      type: "youtube",
    });
    deleteLoadingMsg();
    noContent = false;
    send(youTubeReport);
  }

  if (twitterCollection.size > 0) {
    const twitterReport = await generateTwitterSummary(
      twitterCollection,
      hourLimit
    );
    deleteLoadingMsg();
    noContent = false;
    send(twitterReport);
  }

  if (discussionCollection.size > 0) {
    const discussionReport = await generateDiscussionSummary(
      discussionCollection,
      hourLimit
    );
    deleteLoadingMsg();
    noContent = false;
    send(discussionReport);
  }

  if (noContent) {
    send(
      `It's been pretty quiet in <#${message.channel.id}>, we have nothing to summarize! Try a broader time window or pick a more interesting channel I guess?`
    );
  }
};
