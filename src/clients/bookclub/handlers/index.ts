import { Client } from "pg";

import handleMessageCreate from "./messageCreate";
import handleInteractionCreate from "./interactionCreate";
import handleReady from "./handleReady";
import handleThreadCreate from "./handleThreadCreate";

export default function generateBookClubBotHandlers(db: Client) {
  return {
    handleMessageCreate,
    handleInteractionCreate,
    handleReady,
    handleThreadCreate,
  };
}
