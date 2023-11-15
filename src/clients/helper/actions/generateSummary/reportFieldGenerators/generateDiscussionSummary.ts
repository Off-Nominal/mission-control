import { Collection, Message, EmbedBuilder } from "discord.js";
import { filterNumbers } from "../helpers/filterNumbers";
import { filterWords } from "../helpers/filterWords";
import { generateWordCloud } from "../helpers/generateWordCloud";

export const generateDiscussionSummary = async (
  collection: Collection<string, Message>,
  hourLimit: number,
  channelId: string
) => {
  let discussedWords = [];
  const embed = new EmbedBuilder();
  embed
    .setAuthor({
      name: "Discussion Summary",
      iconURL:
        "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822909/Discord%20Assets/ETC-discussion-icon-P-201812041059_t4f5no.jpg",
    })
    .setDescription(
      `It's been pretty quiet in <#${channelId}> over the last ${hourLimit} hours, I don't have enough useful words to make a meaningful analysis!`
    );

  collection.forEach((message) => {
    let words = message.content.split(" ");
    words = filterWords(words, ["http", "!", "<#", "<@"]);
    words = filterNumbers(words);
    if (words.length) {
      discussedWords = discussedWords.concat(words);
    }
  });

  if (discussedWords.length < 3) {
    return embed;
  }

  let wordCloudUrl: null | string = null;

  try {
    const response = await generateWordCloud(discussedWords.join(" "));
    wordCloudUrl = response.secure_url;
  } catch (err) {
    console.error(err);
  }

  if (!wordCloudUrl) {
    return embed;
  }

  embed
    .setDescription(
      `A visualization of user discussion in <#${channelId}> the last ${hourLimit} hours. [[View Externally]](${wordCloudUrl})\n\nThere have been ${collection.size} text messages posted by users in this time period.`
    )
    .setImage(wordCloudUrl);

  return embed;
};
