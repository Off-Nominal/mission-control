import { Client } from "pg";
import handleReady from "./handleReady";
import handleInteractionCreate from "./handleInteractionCreate";

export default function generateNdb2BotHandlers(db: Client) {
  return {
    handleReady,
    handleInteractionCreate,
  };
}
