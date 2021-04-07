import { Collection, Message, MessageEmbed } from "discord.js";
import { filterHttp } from "../helpers/filterHttp";
import { generateWordCloud } from "../helpers/generateWordCloud";

export const generateDiscussionSummary = async (
  collection: Collection<string, Message>,
  hourLimit: number
) => {
  let discussion = [];
  const embed = new MessageEmbed();

  if (collection.size < 1) {
    return embed
      .setAuthor("No messages")
      .setDescription(
        `There don't seem to be any messages posted in the last ${hourLimit} hours`
      );
  }

  collection.forEach((message) => {
    const words = filterHttp(message.content);
    if (words.length) {
      discussion = discussion.concat(words);
    }
  });

  let wordCloudUrl: null | string = null;

  try {
    const response = await generateWordCloud(discussion.join(" "));
    wordCloudUrl = response.secure_url;
  } catch (err) {
    console.error(err);
  }

  embed
    .setAuthor(
      "Discussion Summary",
      "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822909/Discord%20Assets/ETC-discussion-icon-P-201812041059_t4f5no.jpg"
    )
    .setDescription(
      `A visualization of user discussion in the last ${hourLimit} hours. [View Externally](${wordCloudUrl})`
    )
    .setImage(wordCloudUrl);

  return embed;
};
