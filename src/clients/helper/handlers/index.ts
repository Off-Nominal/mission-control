import handleMessageCreate from "./handleMessageCreate";
import handleThreadCreate from "./handleThreadCreate";
import handleGuildMemberUpdate from "./handleGuildMemberUpdate";
import handleMessageReactionAdd from "./handleMessageReactionAdd";
import handleReady from "./handleReady";
import handleInteractionCreate from "./handleInteractionCreate";
import handleThreadDigestSend from "./handleThreadDigestSend";
import handleStarshipSiteUpdate from "./handleStarshipSiteUpdate";
import handleSendDelinquents from "./handleSendDelinquents";
import { Client } from "pg";

export default function generateMainBotHandlers(db: Client) {
  return {
    handleMessageCreate,
    handleThreadCreate,
    handleGuildMemberUpdate,
    handleMessageReactionAdd,
    handleReady,
    handleInteractionCreate,
    handleThreadDigestSend,
    handleStarshipSiteUpdate,
    handleSendDelinquents,
  };
}
