import { DMChannel, MessageReaction, PartialUser, User } from "discord.js";
import { ReportGenerator } from "../../../utilities/ReportGenerator";

export const utilityReactHandler = async (
  messageReact: MessageReaction,
  user: User | PartialUser,
  reportGenerator: ReportGenerator
) => {
  if (messageReact.emoji.toString() !== "📩") return;
  if (user.bot) return;

  const messageId = messageReact.message.id;
  const reportId = reportGenerator.getReportId(messageId);

  let dmChannel: DMChannel;

  try {
    dmChannel = await user.createDM();
  } catch (err) {
    console.error(err);
    return;
  }

  if (!reportId) {
    return dmChannel.send(
      "Sorry - I don't keep these reports forever and this one seems to already be gone. Try generating another one using `!summary`!"
    );
  }

  try {
    await reportGenerator.sendReport(dmChannel, reportId, "dm");
  } catch (err) {
    console.log(err);
  }
};
