import {
  DMChannel,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  TextChannel,
  User,
} from "discord.js";
import { ChannelBabysitter } from "../../../utilities/channelBabysitter";
import { ReportGenerator } from "../../../utilities/ReportGenerator";

export default async function handleMessageReactionAdd(
  messageReact: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  utilities: {
    channelBabysitter: ChannelBabysitter;
  }
) {
  const { channelBabysitter } = utilities;

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

  // tracked reacts
  switch (messageReact.emoji.toString()) {
    case "📩": {
      // Ignore requests on non-report messages
      if (messageReact.message.embeds[0]?.title !== "Channel Summary Report") {
        break;
      }

      messageReact.client.emit(
        "summaryReportSend",
        user,
        messageReact.message.id
      );
      break;
    }
    case "🔄": {
      // Ignore requests on non-topic messages
      if (messageReact.message.embeds[0]?.title !== "Channel Inactive") {
        break;
      }

      channelBabysitter.recycleTopic(
        messageReact.message.channel as TextChannel
      );

      await messageReact.message.delete();
      break;
    }
    default:
      return;
  }
}
