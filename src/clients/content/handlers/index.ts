import { Client } from "pg";

import handleReady from "./handleReady";
import handleNewContent from "./handleNewContent";
import handleThreadCreate from "./handleThreadCreate";
import handleInteractionCreate from "./handleInteractionCreate";
import handleEventEnded from "./handleEventEnded";
import handleRssList from "./handleRssList";

export default function generateContentBotHandlers(db: Client) {
  return {
    handleReady,
    handleNewContent,
    handleThreadCreate,
    handleInteractionCreate,
    handleEventEnded,
    handleRssList,
  };
}
