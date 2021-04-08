import { Collection, Message, MessageEmbed } from "discord.js";
import { filterNumbers } from "../helpers/filterNumbers";
import { filterWords } from "../helpers/filterWords";
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

  collection.forEach((message) => {
    let words = message.content.split(" ");
    words = filterWords(words, ["http", "@", "!"]);
    words = filterNumbers(words);
    if (words.length) {
      discussedWords = discussedWords.concat(words);
    }
  });

  if (!discussedWords.length) {
    return embed.setDescription(
      `There don't seem to be any messages posted in the last ${hourLimit} hours`
    );
  }

  let wordCloudUrl: null | string = null;

  try {
    const response = await generateWordCloud(discussedWords.join(" "));
    wordCloudUrl = response.secure_url;
  } catch (err) {
    console.error(err);
  }

  embed
    .setDescription(
      `A visualization of user discussion in the last ${hourLimit} hours. [[View Externally]](${wordCloudUrl})\n\nThere have been ${collection.size} text messages posted by users in this time period.`
    )
    .setImage(wordCloudUrl);

  return embed;
};
