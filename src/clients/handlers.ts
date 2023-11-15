import contentBotHandlers from "./content/handlers";
import eventBotHandlers from "./event/handlers";
import helperBotHandlers from "./helper/handlers";
import ndb2BotHandlers from "./ndb2/handlers";

import devHandlers from "./dev/handlers";

export default {
  content: contentBotHandlers,
  dev: devHandlers,
  events: eventBotHandlers,
  helper: helperBotHandlers,
  ndb2: ndb2BotHandlers,
};
