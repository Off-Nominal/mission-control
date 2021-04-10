import { DMChannel, MessageReaction, PartialUser, User } from "discord.js";
import { ReportGenerator } from "../../../utilities/ReportGenerator";

export const utilityReactHandler = async (
  messageReact: MessageReaction,
  user: User | PartialUser,
  reportGenerator: ReportGenerator
) => {
  // Ignore emojies that aren't the envelope or that are from bots
  if (messageReact.emoji.toString() !== "📩") return;
  if (user.bot) return;

  let react = messageReact;

  // When the bot restarts, old messages are partials and cached.
  // If a user requests a report from a message prior to when the bot booted,
  // it must fetch the full message to get its Id
  if (messageReact.partial) {
    react = await messageReact.fetch();
  }

  // Ignore requests on non-report messages
  if (react.message.embeds[0]?.title !== "Channel Summary Report") {
    return;
  }

  const messageId = react.message.id;
  const reportId = reportGenerator.getReportId(messageId);

  let dmChannel: DMChannel;

  try {
    dmChannel = await user.createDM();
  } catch (err) {
    console.error(err);
    return;
  }

  // When the bot restarts, previous reports are cleared.
  // Also works as a catch all error in case there is another problem fetching
  if (!reportId) {
    return dmChannel.send(
      "Sorry - I don't keep these reports forever and this one seems to already be gone. Try generating another one using `!summary`!"
    );
  }

  try {
    await reportGenerator.sendReport(dmChannel, reportId, "dm");
  } catch (err) {
    console.error(err);
  }
};
