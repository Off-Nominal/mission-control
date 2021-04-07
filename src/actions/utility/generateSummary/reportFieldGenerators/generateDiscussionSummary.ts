import { Collection, Message, MessageEmbed } from "discord.js";
import { filterHttp } from "../helpers/filterHttp";
import { generateWordCloud } from "../helpers/generateWordCloud";

export const generateDiscussionSummary = async (
  collection: Collection<string, Message>,
  hourLimit: number
) => {
  let discussedWords = [];
  const embed = new MessageEmbed();
  embed.setAuthor(
    "Discussion Summary",
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822909/Discord%20Assets/ETC-discussion-icon-P-201812041059_t4f5no.jpg"
  );

  if (collection.size < 1) {
    return embed.setDescription(
      `There don't seem to be any messages posted in the last ${hourLimit} hours`
    );
  }

  collection.forEach((message) => {
    const words = filterHttp(message.content);
    if (words.length) {
      discussedWords = discussedWords.concat(words);
    }
  });

  let wordCloudUrl: null | string = null;

  try {
    const response = await generateWordCloud(discussedWords.join(" "));
    wordCloudUrl = response.secure_url;
  } catch (err) {
    console.error(err);
  }

  embed

    .setDescription(
      `A visualization of user discussion in the last ${hourLimit} hours. [[View Externally]](${wordCloudUrl})`
    )
    .setImage(wordCloudUrl);

  return embed;
};
