import { Ndb2Client } from "../index";

// Queries
import { generateAddBet } from "./addBet";
import { generateAddPrediction } from "./addPrediction";
import { generateGetPrediction } from "./getPrediction";

const ndbKey = process.env.NDB2_CLIENT_ID;
const ndb2Client = new Ndb2Client(ndbKey);

export default {
  addBet: generateAddBet(ndb2Client),
  addPrediction: generateAddPrediction(ndb2Client),
  getPrediction: generateGetPrediction(ndb2Client),
};
