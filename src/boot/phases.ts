import { connectDiscordClient } from "../helpers/discord-client-connect";
import bootLogger from "../logger";
import { LogStatus } from "../logger/Logger";
import mcconfig from "../mcconfig";
import { providers } from "../providers";
import { connectDatabase } from "../providers/db";
import { startNdb2Client } from "../providers/ndb2-client";
import { startLaunchClient } from "../providers/rllc";
import { rssBootTasks } from "../providers/rss-providers";
import { BootPhase } from "./types";

function listenApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = providers.api.listen(mcconfig.api.port, () => {
      server.off("error", reject);
      bootLogger.addLog(
        LogStatus.SUCCESS,
        "Express Server booted and listening.",
      );
      bootLogger.logItemSuccess("api");
      console.log(
        "[Boot] /health is live (liveness, always 200) — use /ready or health.alert for Discord readiness",
      );
      resolve();
    });
    server.once("error", reject);
  });
}

// Everything that can finish without a Discord gateway session.
export function foundationPhase(): BootPhase {
  return {
    name: "foundation",
    tasks: [
      { name: "api", run: listenApi },
      { name: "db", run: connectDatabase },
      { name: "ndb2Client", run: startNdb2Client },
      { name: "launches", run: startLaunchClient },
      ...rssBootTasks(),
    ],
  };
}

// Gateway identifies. This phase starts only after foundation resolves.
export function discordPhase(): BootPhase {
  const bots = [
    ["ndb2", providers.ndb2Bot, mcconfig.discord.clients.ndb2.token],
    ["helper", providers.helperBot, mcconfig.discord.clients.helper.token],
    ["content", providers.contentBot, mcconfig.discord.clients.content.token],
    ["events", providers.eventsBot, mcconfig.discord.clients.events.token],
  ] as const;

  return {
    name: "discord",
    tasks: bots.map(([label, client, token]) => ({
      name: label,
      run: () => connectDiscordClient(client, token, label),
    })),
  };
}
