import { Client } from "discord.js";
import { ContentFeedItem } from "../../../listeners/feedListener/contentFeedListener";
import fetchTextChannel from "../../actions/fetchChannel";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

const TESTCONTENTCHANNEL = process.env.TESTCONTENTCHANNEL;
const CONTENTCHANNELID = process.env.CONTENTCHANNELID || TESTCONTENTCHANNEL;

export default async function handleNewContent(
  content: ContentFeedItem,
  client: Client,
  timeout: number = 0
) {
  const { show } = content;

  const channel = await fetchTextChannel(client, CONTENTCHANNELID);

  function announceNewItem() {
    channel
      .send({
        content: `It's podcast release day for ${show}!`,
        embeds: [createUniqueResultEmbed(content)],
      })
      .then(() => {
        console.log(
          `Discord successfully notified of new podcast episode in ${show}`
        );
      })
      .catch((err) => {
        console.error(`Error sending message to Discord for update to ${show}`);
        console.error(err);
      });
  }

  setTimeout(() => {
    announceNewItem();
  }, timeout * 1000);
}
