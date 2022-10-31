import { Ndb2Client } from "../index";

// Queries
import { generateAddBet } from "./addBet";
import { generateAddPrediction } from "./addPrediction";
import { generateAddVote } from "./addVote";
import { generateDeletePrediction } from "./deletePrediction";
import { generateGetPrediction } from "./getPrediction";
import { generateGetUser } from "./getUser";
import { generateTriggerPrediction } from "./triggerPrediction";

const ndbKey = process.env.NDB2_CLIENT_ID;
const ndb2Client = new Ndb2Client(ndbKey);

export default {
  addBet: generateAddBet(ndb2Client),
  addVote: generateAddVote(ndb2Client),
  addPrediction: generateAddPrediction(ndb2Client),
  getPrediction: generateGetPrediction(ndb2Client),
  triggerPrediction: generateTriggerPrediction(ndb2Client),
  getUser: generateGetUser(ndb2Client),
  deletePrediction: generateDeletePrediction(ndb2Client),
};
