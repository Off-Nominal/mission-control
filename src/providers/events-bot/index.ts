import { Client } from "discord.js";
import mcconfig from "../../mcconfig";

export enum EventBotEvents {
  START = "eventStarted",
  END = "eventEnded",
  RETRIEVED = "eventsRetrieved",
  NEW_TITLE = "newStreamTitle",
  VIEW_TITLES = "viewStreamTitles",
}

const eventsBot = new Client({
  intents: [
    mcconfig.discord.intents.simpleIntents,
    mcconfig.discord.intents.eventIntents,
  ],
});

// Handlers

eventsBot.on("error", console.error);

// eventsBot.on(
//   "guildScheduledEventUpdate",
//   handlers.events.handleGuildScheduledEventUpdate
// );
// eventsBot.on(
//   "guildScheduledEventCreate",
//   handlers.events.handleGuildScheduledEventCreate
// );
// eventsBot.on("guildScheduledEventUpdate", eventsListener.updateEvent);
// eventsBot.on("guildScheduledEventUpdate", (oldEvent, newEvent) => {
//   launchListener.clearEvent(oldEvent, newEvent);
// });
// eventsBot.on("guildScheduledEventCreate", eventsListener.addEvent);
// eventsBot.on("guildScheduledEventDelete", eventsListener.cancelEvent);

// eventsBot.on(EventBotEvents.START, feedListeners.yt.verifyEvent);
// eventsBot.on(EventBotEvents.END, (event) =>
//   handlers.content.handleEventEnded(event, contentBot)
// );
// eventsBot.on(EventBotEvents.END, feedListeners.yt.verifyEvent);

// eventsBot.on("interactionCreate", (interaction) => {
//   handlers.events.handleInteractionCreate(interaction);
// });
// eventsBot.on(EventBotEvents.RETRIEVED, eventsListener.initialize);
// eventsBot.on(
//   EventBotEvents.RETRIEVED,
//   (
//     events: Collection<string, GuildScheduledEvent>,
//     eventManager: GuildScheduledEventManager
//   ) => launchListener.initialize(events, eventManager)
// );
// eventsBot.on(EventBotEvents.NEW_TITLE, streamHost.logSuggestion);
// eventsBot.on(EventBotEvents.VIEW_TITLES, streamHost.viewSuggestions);

export default eventsBot;
