import { Client } from "pg";

import generateBookClubBotHandlers from "./bookclub/handlers";
import generateContentBotHandlers from "./content/handlers";
import generateEventBotHandlers from "./event/handlers";
import generateMainBotHandlers from "./main/handlers";

import genereateDevHandlers from "./dev/handlers";

export default function generateHandlers(db: Client) {
  return {
    bookClubBotHandlers: generateBookClubBotHandlers(db),
    contentBotHandlers: generateContentBotHandlers(db),
    devHandlers: genereateDevHandlers(db),
    eventBotHandlers: generateEventBotHandlers(db),
    mainBotHandlers: generateMainBotHandlers(db),
  };
}
