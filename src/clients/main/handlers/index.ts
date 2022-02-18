import handleMessageCreate from "./handleMessageCreate";
import handleThreadCreate from "./handleThreadCreate";
import handleGuildMemberAdd from "./handleGuildMemberAdd";
import handleMessageReactionAdd from "./handleMessageReactionAdd";
import handleReady from "./handleReady";
import handleInteractionCreate from "./handleInteractionCreate";
import handleThreadDigestSend from "./handleThreadDigestSend";
import handleStarshipSiteUpdate from "./handleStarshipSiteUpdate";
import { Client } from "pg";

export default function generateMainBotHandlers(db: Client) {
  return {
    handleMessageCreate,
    handleThreadCreate,
    handleGuildMemberAdd,
    handleMessageReactionAdd,
    handleReady,
    handleInteractionCreate,
    handleThreadDigestSend,
    handleStarshipSiteUpdate,
  };
}
