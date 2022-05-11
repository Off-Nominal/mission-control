import {
  GuildScheduledEvent,
  MessageOptions,
  MessagePayload,
} from "discord.js";
import { TitleSuggestion } from "../../../listeners/streamHost/partyMessages";
import fetchTextChannel from "../../actions/fetchChannel";
import letters from "../../../helpers/pollIndicators";

const LIVECHATCHANNELID = process.env.LIVECHATCHANNELID;

export default async function handleStreamTitleVote(
  message: string | MessagePayload | MessageOptions,
  event: GuildScheduledEvent<"ACTIVE">,
  answers: TitleSuggestion[]
) {
  try {
    const channel = await fetchTextChannel(event.client, LIVECHATCHANNELID);
    const voteEmbed = await channel.send(message);
    await Promise.all(answers.map((answer, i) => voteEmbed.react(letters[i])));
  } catch (err) {
    console.error(err);
  }
}
