import { Client, TextChannel } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";

const TESTCONTENTCHANNEL = process.env.TESTCONTENTCHANNEL;
const CONTENTCHANNELID = process.env.CONTENTCHANNELID || TESTCONTENTCHANNEL;

export default async function handleNewContent(
  newContent: {
    feed: string;
    content: FeedItem;
  },
  client: Client,
  timeout: number = 0
) {
  const { feed, content } = newContent;

  const channel = (await client.channels.fetch(
    CONTENTCHANNELID
  )) as TextChannel;

  function announceNewItem(podcastURL) {
    console.log(`New episode in ${feed}.\n${podcastURL}`);
    channel
      .send({
        content: `It's podcast release day for ${feed}!\n${podcastURL}`,
      })
      .then(() => {
        console.log(
          `Discord successfully notified of new podcast episode in ${feed}`
        );
      })
      .catch((err) => {
        console.error(`Error sending message to Discord for update to ${feed}`);
        console.error(err);
      });
  }

  setTimeout(() => {
    announceNewItem(content.url);
  }, timeout * 1000);
}
