import handleReady from "./handleReady";
import handleNewContent from "./handleNewContent";
import handleGuildScheduledEventUpdate from "./handleGuildScheduledEventUpdate";
import generateInteractionCreateHandler from "./handleInteractionCreate";
import { Client } from "pg";
import generateGuildScheduledEventCreate from "./handleGuildScheduledEventCreate";

export default function generateEventBotHandlers(db: Client) {
  return {
    handleReady,
    handleNewContent,
    handleGuildScheduledEventUpdate,
    handleInteractionCreate: generateInteractionCreateHandler(db),
    handleGuildScheduledEventCreate: generateGuildScheduledEventCreate(db),
  };
}
