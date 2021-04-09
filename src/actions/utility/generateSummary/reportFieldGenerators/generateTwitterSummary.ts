import { Collection, Message, MessageEmbed } from "discord.js";
import { fetchHashtags } from "../helpers/fetchHashtags";
import { filterNumbers } from "../helpers/filterNumbers";
import { filterWords } from "../helpers/filterWords";
import { generateWordCloud } from "../helpers/generateWordCloud";

const countHandle = (embed: MessageEmbed, handles) => {
  const handleIndex = handles.findIndex(
    (handle) => embed.author.name === handle.name
  );

  if (handleIndex >= 0) {
    handles[handleIndex].count++;
  } else {
    handles.push({
      name: embed.author.name,
      url: embed.author.url,
      count: 1,
    });
  }
};

const generateHandleString = (handles) => {
  return handles
    .slice(0, 5)
    .map(
      (handle) =>
        `[${handle.name}](${handle.url}) [${handle.count} tweet${
          handle.count > 1 ? "s" : ""
        }]`
    )
    .join("\n");
};

const generateHashtagString = (hashtags) => {
  return hashtags
    .slice(0, 5)
    .map(
      (hashtag) =>
        `[${hashtag.tag}](https://twitter.com/hashtag/${hashtag.tag.slice(
          1
        )}) [${hashtag.count} hashtag${hashtag.count > 1 ? "s" : ""}]`
    )
    .join("\n");
};

export const generateTwitterSummary = async (
  collection: Collection<string, Message>,
  hourLimit: number,
  channelId: string
) => {
  const handles = [];
  let hashtags = [];
  let tweetText = [];

  const embed = new MessageEmbed();
  embed.setAuthor(
    "Twitter Summary",
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822131/Discord%20Assets/twitter-icon-circle-blue-logo-preview_lqkibr.png"
  );

  if (collection.size === 0) {
    return embed.setDescription(
      `There were no tweets posted to <#${channelId}> in the last ${hourLimit} hours`
    );
  }

  collection.forEach((tweet) => {
    tweet.embeds.forEach((tweetEmbed) => {
      countHandle(tweetEmbed, handles);
      hashtags = hashtags.concat(fetchHashtags(tweetEmbed.description));
      let words = tweetEmbed.description.split(" ");
      words = filterWords(words, ["http", "@", "#"]);
      words = filterNumbers(words);
      if (words.length) {
        tweetText = tweetText.concat(words);
      }
    });
  });

  handles.sort((a, b) => b.count - a.count);
  hashtags.sort((a, b) => b.count - a.count);

  const handlesString = generateHandleString(handles);
  const hashTagString = generateHashtagString(hashtags);

  let wordCloudUrl: null | string = null;

  if (tweetText.length) {
    try {
      const response = await generateWordCloud(tweetText.join(" "));
      wordCloudUrl = response.secure_url;
    } catch (err) {
      console.error(err);
    }
  }

  const fields = [
    {
      name: "Popular Twitter Accounts",
      value: handlesString || "No tweets posted today",
    },
    {
      name: "Popular Twitter Hashtags",
      value: hashTagString || "No hashtags in tweets posted today.",
    },
    {
      name: "Word Cloud",
      value: wordCloudUrl
        ? `A visualization of twitter content. [[View Externally]](${wordCloudUrl})\n\nThere have been ${collection.size} tweets posted in this time period.`
        : "No useable tweet content for a word cloud.",
    },
  ];

  embed
    .setDescription(
      `Summary of Tweets posted in <#${channelId}> in the last ${hourLimit} hours.`
    )
    .addFields(fields)
    .setImage(wordCloudUrl);

  return embed;
};
