import { Collection, Message, MessageEmbed } from "discord.js";
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

const countHashtags = (text: string, hashtags) => {
  let startPoint: number = 0;

  const findTag = () => {
    const hashIndex = text.indexOf("#", startPoint);

    if (hashIndex === -1) {
      return;
    }

    const endIndex = text.indexOf(" ", hashIndex);
    const tag = text.substring(hashIndex, endIndex);

    const tagIndex = hashtags.findIndex((counter) => tag === counter.tag);

    if (tagIndex >= 0) {
      hashtags[tagIndex].count++;
    } else {
      hashtags.push({
        tag,
        count: 1,
      });
    }

    startPoint = endIndex;

    if (text.indexOf("#", startPoint) >= 0) {
      findTag();
    }
  };

  findTag();
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
  hourLimit: number
) => {
  const handles = [];
  const hashtags = [];
  let tweetText = [];

  const embed = new MessageEmbed();
  embed.setAuthor(
    "Twitter Summary",
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822131/Discord%20Assets/twitter-icon-circle-blue-logo-preview_lqkibr.png"
  );

  if (collection.size === 0) {
    return embed.setDescription(
      `There were no tweets posted to this channel in the last ${hourLimit} hours`
    );
  }

  collection.forEach((tweet) => {
    tweet.embeds.forEach((tweetEmbed) => {
      countHandle(tweetEmbed, handles);
      countHashtags(tweetEmbed.description, hashtags);
      let words = tweetEmbed.description.split(" ");
      words = filterWords(words);
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

  try {
    const response = await generateWordCloud(tweetText.join(" "));
    wordCloudUrl = response.secure_url;
  } catch (err) {
    console.error(err);
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
      value: `A visualization of twitter content. [[View Externally]](${wordCloudUrl})`,
    },
  ];

  embed
    .setDescription(
      `Summary of Tweets posted in this channel in the last ${hourLimit} hours.`
    )
    .addFields(fields)
    .setImage(wordCloudUrl);

  return embed;
};
