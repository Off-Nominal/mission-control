import {
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from "discord.js";
import { HelperBotEvents } from "../../../providers/discord_clients/helper";

export default async function handleMessageReactionAdd(
  messageReact: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  if (user.bot) return;

  // When the bot restarts, old messages are partials and cached.
  // If a user requests a report from a message prior to when the bot booted,
  // it must fetch the full message to get its Id
  if (messageReact.partial) {
    try {
      await messageReact.fetch();
    } catch (err) {
      console.error("Error fetching message partial");
    }
  }

  if (
    messageReact.emoji.toString() === "📩" &&
    messageReact.message.embeds[0]?.title !== "Channel Summary Report"
  ) {
    messageReact.client.emit(
      HelperBotEvents.SUMMARY_SEND,
      user,
      messageReact.message.id
    );
  }
}
