import {
  Collection,
  GuildScheduledEvent,
  GuildScheduledEventManager,
} from "discord.js";
import { add, isBefore } from "date-fns";
import {
  fetchBannerUrl,
  generateEventCreateOptionsFromLaunch,
  generateEventEditOptionsFromLaunch,
} from "./helpers";
import { RLLEvents } from "../../types/eventEnums";
import EventEmitter = require("events");
import { truncateText } from "../../helpers/truncateText";
import { isRejected } from "../../helpers/allSettledTypeGuard";
import { rllc, RLLClient, RLLEntity } from "rocket-launch-live-client";

const FIVE_MINS_IN_MS = 300000;

export default class LaunchListener extends EventEmitter {
  private events: Map<number, GuildScheduledEvent>;
  private client: RLLClient;
  private eventsManager: GuildScheduledEventManager;

  constructor(key) {
    super();
    this.events = new Map<number, GuildScheduledEvent>();
    this.client = rllc(key);
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

    this.syncEvents()
      .then(() => {
        this.emit(RLLEvents.READY, "RLL Client synced successfully.");
      })
      .catch((err) => {
        this.emit(
          RLLEvents.BOOT_ERROR,
          `RLL Client failed to sync launch events on boot.`
        );
      })
      .finally(() => {
        this.monitor();
        this.emit(RLLEvents.READY, "RLL Client monitoring API.");
      });
  }

  private syncEvents() {
    const now = new Date();

    return this.client
      .launches({ after_date: now, before_date: add(now, { days: 7 }) })
      .then((response) => {
        const promises: Promise<
          RLLEntity.Launch | GuildScheduledEvent | void
        >[] = [];

        response.result.forEach((launch) => {
          if (launch.result !== -1) return;
          if (!launch.win_open) return;
          const winOpen = new Date(launch.win_open);
          if (isBefore(winOpen, now)) return;

          const event = this.events.get(launch.id);
          if (event) {
            return promises.push(this.syncEvent(event, launch));
          }

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
        });

        // Sync any events that are not in the API call (which may have moved)
        const fetchedIds = response.result.map((result) => result.id);
        this.events.forEach((event, rllId) => {
          if (!fetchedIds.includes(rllId)) {
            const promise = this.client
              .launches({ id: rllId })
              .then((response) => this.syncEvent(event, response.result[0]));

            promises.push(promise);
          }
        });

        return Promise.allSettled(promises);
      })
      .then((promises) => {
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
      });
  }

  private monitor() {
    setInterval(() => {
      this.syncEvents().catch((err) => {
        let error = "API Call Error";
        console.log(err);
        for (const item in err) {
          error += `\n${item}: ${err[item]}`;
        }
        this.emit(RLLEvents.ERROR, {
          event: "Interval API Sync",
          error,
        });
      });
    }, FIVE_MINS_IN_MS);
  }

  private syncEvent(event: GuildScheduledEvent, launch: RLLEntity.Launch) {
    if (!launch.win_open) {
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
}
