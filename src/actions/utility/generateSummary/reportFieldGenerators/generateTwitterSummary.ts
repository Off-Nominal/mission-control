import { Collection, Message, MessageEmbed } from "discord.js";

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

export const generateTwitterSummary = (
  collection: Collection<string, Message>
) => {
  const handles = [];
  const hashtags = [];
  const tweetText = [];

  collection.forEach((tweet) => {
    tweet.embeds.forEach((tweetEmbed) => {
      countHandle(tweetEmbed, handles);
      countHashtags(tweetEmbed.description, hashtags);
    });
  });

  handles.sort((a, b) => b.count - a.count);
  hashtags.sort((a, b) => b.count - a.count);

  const handlesString = handles
    .slice(0, 3)
    .map(
      (handle) =>
        `[${handle.name}](${handle.url}) [${handle.count} tweet${
          handle.count > 1 ? "s" : ""
        }]`
    )
    .join("\n");

  const hashTagString = hashtags
    .slice(0, 3)
    .map(
      (hashtag) =>
        `[${hashtag.tag}](https://twitter.com/hashtag/${hashtag.tag.slice(
          1
        )}) [${hashtag.count} hashtag${hashtag.count > 1 ? "s" : ""}]`
    )
    .join("\n");

  return [
    {
      name: "Popular Twitter Accounts",
      value: handlesString,
    },
    {
      name: "Popular Twitter Hashtags",
      value: hashTagString || "No hashtags in tweets posted today.",
    },
  ];
};
