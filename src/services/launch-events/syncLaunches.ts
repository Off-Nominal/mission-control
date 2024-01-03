import {
  Client,
  Collection,
  Guild,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
} from "discord.js";
import { RLLEntity } from "rocket-launch-live-client";
import {
  fetchBannerUrl,
  generateEventCreateOptionsFromLaunch,
  generateEventEditOptionsFromLaunch,
  getLaunchDate,
} from "./helpers";
import { add, isAfter, isBefore } from "date-fns";
import fetchGuild from "../../helpers/fetchGuild";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import { isRejected } from "../../helpers/allSettledTypeGuard";
import { truncateText } from "../../helpers/truncateText";
import { getRllIdFromEvent } from "../../helpers/rll_utils";

const MAX_WINDOW_IN_DAYS = 7;

const getDiscordEventByLaunchId = (
  events: Collection<string, GuildScheduledEvent<GuildScheduledEventStatus>>,
  launchId: number
): GuildScheduledEvent<GuildScheduledEventStatus> | null => {
  for (const event of events.values()) {
    const rllId = getRllIdFromEvent(event);

    if (rllId === launchId) {
      return event;
    }
  }

  return null;
};

function syncEvent(
  event: GuildScheduledEvent<GuildScheduledEventStatus>,
  launch: RLLEntity.Launch,
  launchDate: Date
) {
  return fetchBannerUrl(launch.vehicle.id).then((bannerUrl) => {
    const eventEditOptions = generateEventEditOptionsFromLaunch(
      event,
      launch,
      launchDate,
      bannerUrl
    );
    return eventEditOptions
      ? event.edit(eventEditOptions)
      : Promise.resolve(event);
  });
}

export async function syncEvents(
  launches: Map<number, RLLEntity.Launch>,
  eventsBot: Client,
  eventType: "new" | "change" | "ready"
): Promise<void> {
  const logger = new Logger(
    "Launch Events",
    LogInitiator.RLL,
    "Launch Sync Triggered: " + eventType
  );

  const promises: Promise<RLLEntity.Launch | GuildScheduledEvent | void>[] = [];

  let guild: Guild;

  try {
    const fetchedGuild = await fetchGuild(eventsBot);
    if (fetchedGuild !== undefined) {
      guild = fetchedGuild;
      logger.addLog(LogStatus.SUCCESS, "Guild fetched successfully.");
    } else {
      throw new Error("Guild not found");
    }
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Could not fetch Guild.");
    logger.sendLog(eventsBot);
    return Promise.reject("Guild not found");
  }

  const eventsManager = guild.scheduledEvents;

  let currentEvents: Collection<
    string,
    GuildScheduledEvent<GuildScheduledEventStatus>
  >;

  try {
    currentEvents = await eventsManager.fetch();
    const eventCount = currentEvents.size;
    logger.addLog(
      LogStatus.SUCCESS,
      `${eventCount} Events fetched successfully.`
    );
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, "Could not fetch Events.");
    logger.sendLog(eventsBot);
    return Promise.reject();
  }

  const counts = {
    creates: 0,
    edits: 0,
    deletes: 0,
  };

  // iterate through api launches to ensure events reflect
  for (const [launchId, launch] of launches) {
    // ignore completed launches
    if (
      launch.result === 0 ||
      launch.result === 1 ||
      launch.result === 2 ||
      launch.result === 3
    )
      continue;

    const launchDate = getLaunchDate(launch);

    // ignore launches without specific enough launch date
    if (!launchDate) continue;

    const now = new Date();

    // ignore launches in the past
    if (isBefore(launchDate, now)) continue;

    // if event already exists, sync it
    const event = getDiscordEventByLaunchId(currentEvents, launch.id);
    if (event) {
      counts.edits++;
      promises.push(syncEvent(event, launch, launchDate));
      continue;
    }

    // if its outside of 7 days, ignore it
    if (isAfter(launchDate, add(now, { days: MAX_WINDOW_IN_DAYS }))) {
      continue;
    }

    // create new event
    const promise = fetchBannerUrl(launch.vehicle.id).then((banner) => {
      counts.creates++;
      return eventsManager.create(
        generateEventCreateOptionsFromLaunch(launch, launchDate, banner)
      );
    });

    promises.push(promise);
  }

  // iterate through discord events to ensure they are up to date
  for (const event of currentEvents.values()) {
    // Ignore events that are not in the future
    if (event.status !== GuildScheduledEventStatus.Scheduled) continue;

    // Ignore non-RLL event
    if (!event.description) continue;
    const rllId = getRllIdFromEvent(event);
    if (!rllId) continue;

    // Fetch the launch referenced in the event
    const launch = launches.get(rllId);

    // This event is no longer on the API, delete it
    if (!launch) {
      counts.deletes++;
      promises.push(event.delete());
      continue;
    }

    const launchDate = getLaunchDate(launch);

    // This launch no longer has a specific enough launch date, delete it
    if (!launchDate) {
      counts.deletes++;
      promises.push(event.delete());
      continue;
    }

    promises.push(syncEvent(event, launch, launchDate));
  }

  return Promise.allSettled(promises).then((promises) => {
    logger.addLog(
      LogStatus.INFO,
      `Launch Sync Complete. Attempted ${counts.creates} creates, ${counts.edits} edits, and ${counts.deletes} deletes.`
    );

    promises.forEach((promise) => {
      if (isRejected(promise)) {
        let reason = "";
        if (
          "message" in promise.reason &&
          typeof promise.reason.message === "string"
        ) {
          reason = promise.reason.message;
        } else {
          console.error(promise.reason);
        }

        logger.addLog(LogStatus.FAILURE, truncateText(reason, 1000));
      }
    });

    logger.sendLog(eventsBot);
  });
}
