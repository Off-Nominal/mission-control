import {
  Collection,
  GuildScheduledEvent,
  GuildScheduledEventManager,
  GuildScheduledEventStatus,
} from "discord.js";
import { add, isAfter, isBefore } from "date-fns";
import {
  fetchBannerUrl,
  generateEventCreateOptionsFromLaunch,
  generateEventEditOptionsFromLaunch,
  getLaunchDate,
} from "./helpers";
import { RLLEvents } from "../../types/eventEnums";
import EventEmitter = require("events");
import { truncateText } from "../../helpers/truncateText";
import { isRejected } from "../../helpers/allSettledTypeGuard";
import {
  rllc,
  RLLClient,
  RLLEntity,
  RLLWatcher,
} from "rocket-launch-live-client";

const MAX_WINDOW_IN_DAYS = 7;
const WATCHER_INTERVAL = 5;

export default class LaunchListener extends EventEmitter {
  private events: Map<number, GuildScheduledEvent>;
  private client: RLLClient;
  private watcher: RLLWatcher;
  private eventsManager: GuildScheduledEventManager;

  constructor(key) {
    super();
    this.events = new Map<number, GuildScheduledEvent>();

    try {
      this.client = rllc(key);
    } catch (err) {
      console.error(err);
      this.emit(RLLEvents.BOOT_ERROR, `RLL Client failed to initialize.`);
    }

    try {
      this.watcher = this.client.watch(WATCHER_INTERVAL, {
        after_date: new Date(),
      });
    } catch (err) {
      console.error(err);
      this.emit(
        RLLEvents.BOOT_ERROR,
        `RLL Client watcher failed to initialize.`
      );
    }

    this.watcher.on("init_error", (error) => {
      this.emit(RLLEvents.BOOT_ERROR, {
        event: `RLL Client failed initiate cache on boot.`,
        error,
      });
    });

    this.watcher.on("error", (err) => {
      let error = "API Call Error";
      for (const item in err) {
        error += `\n${item}: ${err[item]}`;
      }
      this.emit(RLLEvents.ERROR, {
        event: "Interval API Sync",
        error,
      });
    });
  }

  public initialize(
    events: Collection<string, GuildScheduledEvent>,
    eventsManager: GuildScheduledEventManager
  ) {
    this.eventsManager = eventsManager;
    events.forEach((event) => {
      const rllId = event.description.match(new RegExp(/(?<=\[)(.*?)(?=\])/gm));

      if (rllId?.length) {
        this.events.set(Number(rllId[0]), event);
      }
    });

    this.watcher.on("ready", () => {
      this.emit(RLLEvents.READY, "RLL Client synced successfully.");
      this.emit(RLLEvents.READY, "RLL Client monitoring API.");
      this.syncEvents();

      this.watcher.on("call", (params) => {
        console.log(params);
        this.syncEvents();
      });
    });

    this.watcher.start();
  }

  private syncEvents() {
    const promises: Promise<RLLEntity.Launch | GuildScheduledEvent | void>[] =
      [];

    // iterate through launch cache to ensure events reflect
    for (const [launchId, launch] of this.watcher.launches) {
      // ignore completed launches
      if (launch.result !== -1) continue;

      const launchDate = getLaunchDate(launch);

      // ignore launches without window open times
      if (!launchDate) continue;

      const now = new Date();

      // ignore launches with window opens in the past
      if (isBefore(launchDate, now)) continue;

      // if event already exists, sync it
      const event = this.events.get(launch.id);

      if (event) {
        promises.push(this.syncEvent(event, launch));
        continue;
      }

      //if its outside of 7 days, ignore it
      if (isAfter(launchDate, add(now, { days: MAX_WINDOW_IN_DAYS }))) {
        continue;
      }

      // create new event
      const promise = fetchBannerUrl(launch.vehicle.id)
        .then((banner) => {
          return this.eventsManager.create(
            generateEventCreateOptionsFromLaunch(launch, banner)
          );
        })
        .then((event) => {
          this.events.set(launch.id, event);
          return event;
        });

      promises.push(promise);
    }

    return Promise.allSettled(promises).then((promises) => {
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

          this.emit(RLLEvents.ERROR, {
            event: "Event Edit/Create Failure for Rocket Launch",
            error: truncateText(reason, 1000),
          });
        }
      });

      return Promise.resolve();
    });
  }

  private syncEvent(event: GuildScheduledEvent, launch: RLLEntity.Launch) {
    const launchDate = getLaunchDate(launch);

    if (!launchDate) {
      return event.delete();
    }

    return fetchBannerUrl(launch.vehicle.id).then((bannerUrl) => {
      const eventEditOptions = generateEventEditOptionsFromLaunch(
        event,
        launch,
        bannerUrl
      );
      return eventEditOptions
        ? event.edit(eventEditOptions)
        : Promise.resolve(event);
    });
  }

  // Removes completed events from the cache
  public clearEvent(
    _,
    newEvent: GuildScheduledEvent<
      | GuildScheduledEventStatus.Active
      | GuildScheduledEventStatus.Completed
      | GuildScheduledEventStatus.Scheduled
    >
  ) {
    // Ignore events that recieved changes
    if (newEvent.status === GuildScheduledEventStatus.Scheduled) {
      return;
    }

    const rllIds = newEvent.description.match(
      new RegExp(/(?<=\[)(.*?)(?=\])/gm)
    );

    // Ignore events that aren't synced launches
    if (rllIds.length === 0) {
      return;
    }

    const rllId = Number(rllIds[0]);

    // ignore events that are already deleted
    if (!this.events.has(rllId)) {
      return;
    }

    this.events.delete(rllId);
  }
}
