import handlers from "../../clients/handlers";
import { EventListenerEvents, EventsListener } from "./EventsListener";

const eventsListener = new EventsListener();

// eventsListener.on(
//   EventListenerEvents.MONITOR,
//   handlers.events.handleEventsMonitored
// );

export default eventsListener;
