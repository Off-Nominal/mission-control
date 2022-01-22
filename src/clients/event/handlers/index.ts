import handleReady from "./handleReady";
import handleNewContent from "./handleNewContent";
import handleGuildScheduledEventUpdate from "./handleGuildScheduledEventUpdate";
import generateInteractionCreateHandler from "./handleInteractionCreate";
import { Client } from "pg";

export default function generateEventBotHandlers(db: Client) {
  return {
    handleReady,
    handleNewContent,
    handleGuildScheduledEventUpdate,
    handleInteractionCreate: generateInteractionCreateHandler(db),
  };
}
