import { Client } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";
import fetchTextChannel from "../../actions/fetchChannel";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

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

  const channel = await fetchTextChannel(client, CONTENTCHANNELID);

  function announceNewItem() {
    channel
      .send({
        content: `It's podcast release day for ${feed}!`,
        embeds: [createUniqueResultEmbed(feed, content)],
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
    announceNewItem();
  }, timeout * 1000);
}
