import { Providers } from "../../../providers";
import {
  eventNameIncludes,
  getCountryFromEvent,
  getProviderIdFromEvent,
  isSpaceX,
} from "../../../helpers/rll_utils";

export default function EventForumThreadAdd({
  models,
  notifications,
}: Providers) {
  notifications.on("event_forum_post", async (event, thread) => {
    const providerId = getProviderIdFromEvent(event);

    // determine event type
    const isStarlink =
      isSpaceX(providerId) && eventNameIncludes(event, "starlink");
    const isUnknownChina =
      getCountryFromEvent(event)?.toLowerCase() === "china" &&
      eventNameIncludes(event, "tbd");

    // fetch applicable users
    const newSubscribers =
      await models.userNotifications.fetchNewEventSubscribers({
        isStarlink,
        isUnknownChina,
      });

    notifications.queueThreadAdd(
      thread,
      newSubscribers.map((user) => user.discord_id)
    );
  });
}
