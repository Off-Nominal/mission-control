import { add, format, isBefore } from "date-fns";
import {
  Collection,
  GuildScheduledEvent,
  GuildScheduledEventManager,
} from "discord.js";
import RocketLaunchLiveClient from "../../utilities/rocketLaunchLiveClient/rocketLaunchLiveClient";
import { Launch } from "../../utilities/rocketLaunchLiveClient/types";
import {
  generateEventCreateOptionsFromLaunch,
  generateEventEditOptionsFromLaunch,
} from "./helpers";

const FIVE_MINS_IN_MS = 300000;

export default class LaunchListener {
  private events: Map<number, GuildScheduledEvent>;
  private client: RocketLaunchLiveClient;
  private eventsManager: GuildScheduledEventManager;

  constructor(key) {
    this.events = new Map<number, GuildScheduledEvent>();
    this.client = new RocketLaunchLiveClient(key);
  }

  public initialize(
    events: Collection<string, GuildScheduledEvent>,
    eventsManager: GuildScheduledEventManager
  ) {
    this.eventsManager = eventsManager;
    events.forEach((event) => {
      const rllId = event.description.match(new RegExp(/(?<=\[)(.*?)(?=\])/gm));

      if (rllId && rllId.length) {
        this.events.set(Number(rllId[0]), event);
      }
    });

    this.syncEvents().then(() => {
      console.log("Launches synced with RLL");
      this.monitor();
    });
  }

  private syncEvents() {
    // GET ALL EVENTS WITHIN 7 DAYS
    const now = new Date();
    const window = add(now, { days: 7 });

    return this.client
      .fetchLaunches({
        before_date: format(window, "yyyy-MM-dd"),
        after_date: format(now, "yyyy-MM-dd"),
      })
      .then((results) => {
        const promises: Promise<Launch | GuildScheduledEvent | void>[] = [];

        results.forEach((launch) => {
          if (launch.result !== -1) return;
          if (!launch.win_open) return;
          const winOpen = new Date(launch.win_open);
          if (isBefore(winOpen, now)) return;

          const event = this.events.get(launch.id);
          if (event) {
            return promises.push(this.syncEvent(event, launch));
          }

          console.log(`* Adding ${launch.name}`);

          const promise = this.eventsManager
            .create(generateEventCreateOptionsFromLaunch(launch))
            .then((event) => {
              this.events.set(launch.id, event);
              return event;
            })
            .catch((err) => {
              console.error(err);
              throw err;
            });

          promises.push(promise);
        });

        // Sync any events that are not in the API call (which may have moved)

        const fetchedIds = results.map((result) => result.id);
        this.events.forEach((event, rllId) => {
          if (!fetchedIds.includes(rllId)) {
            const promise = this.client
              .fetchLaunches({ id: rllId.toString() })
              .then((launch) => {
                this.syncEvent(event, launch[0]);
                return launch[0];
              });

            promises.push(promise);
          }
        });

        return Promise.allSettled(promises);
      })
      .catch((err) => console.error(err));
  }

  private monitor() {
    setInterval(() => {
      this.syncEvents();
    }, FIVE_MINS_IN_MS);
  }

  private syncEvent(event: GuildScheduledEvent, launch: Launch) {
    if (!launch.win_open) {
      return event.delete();
    }

    const eventEditOptions = generateEventEditOptionsFromLaunch(event, launch);

    if (!eventEditOptions) {
      return;
    }

    return event.edit(eventEditOptions).catch((err) => console.error(err));
  }
}
