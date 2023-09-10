import { Client } from "pg";

import generateContentBotHandlers from "./content/handlers";
import generateEventBotHandlers from "./event/handlers";
import generateMainBotHandlers from "./main/handlers";
import generateNdb2BotHandlers from "./ndb2/handlers";

import genereateDevHandlers from "./dev/handlers";

export default function generateHandlers(db: Client) {
  return {
    contentBotHandlers: generateContentBotHandlers(db),
    devHandlers: genereateDevHandlers(db),
    eventBotHandlers: generateEventBotHandlers(db),
    mainBotHandlers: generateMainBotHandlers(db),
    ndb2BotHandlers: generateNdb2BotHandlers(db),
  };
}
