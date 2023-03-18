import { Client } from "pg";
import handleReady from "./handleReady";
import generateHandleInteractionCreate from "./handleInteractionCreate";
import generateHandleNewPrediction from "./handleNewPrediction";
import generateHandleNewBet from "./handleNewBet";

export default function generateNdb2BotHandlers(db: Client) {
  return {
    handleReady,
    handleInteractionCreate: generateHandleInteractionCreate(db),
    handleNewPrediction: generateHandleNewPrediction(db),
    handleNewBet: generateHandleNewBet(db),
  };
}
