import { Client } from "pg";
import handleReady from "./handleReady";

export default function generateNdb2BotHandlers(db: Client) {
  return {
    handleReady,
  };
}
