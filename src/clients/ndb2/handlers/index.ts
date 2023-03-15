import { Client } from "pg";
import handleReady from "./handleReady";
import handleInteractionCreate from "./handleInteractionCreate";
import handleNewPrediction from "./handleNewPrediction";
import handleNewBet from "./handleNewBet";

export default function generateNdb2BotHandlers(db: Client) {
  return {
    handleReady,
    handleInteractionCreate,
    handleNewPrediction,
    handleNewBet,
  };
}
