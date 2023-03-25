import { Client } from "pg";
import handleReady from "./handleReady";
import generateHandleInteractionCreate from "./handleInteractionCreate";
import generateHandleNewPrediction from "./handleNewPrediction";
import generateHandleNewBet from "./handleNewBet";
import generateHandleViewPrediction from "./handleViewPrediction";
import generateHandleViewDetails from "./handleViewDetails";
import generateHandleRetirePrediction from "./handleRetirePrediction";
import generateHandleTriggerPrediction from "./handleTriggerPrediction";
import generateHandleNewVote from "./handleNewVote";

export default function generateNdb2BotHandlers(db: Client) {
  return {
    handleReady,
    handleInteractionCreate: generateHandleInteractionCreate(db),
    handleNewPrediction: generateHandleNewPrediction(db),
    handleNewBet: generateHandleNewBet(db),
    handleViewPrediction: generateHandleViewPrediction(db),
    handleViewDetails: generateHandleViewDetails(db),
    handleRetirePrediction: generateHandleRetirePrediction(db),
    handleTriggerPrediction: generateHandleTriggerPrediction(db),
    handleNewVote: generateHandleNewVote(db),
  };
}
