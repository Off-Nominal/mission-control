import handlers from "../../clients/handlers";
import { StreamHost, StreamHostEvents } from "./StreamHost";

const streamHost = new StreamHost();

// streamHost.on(
//   StreamHostEvents.PARTY_MESSAGE,
//   handlers.events.handlePartyMessage
// );

export default streamHost;
