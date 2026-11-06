import { isRejected } from "../../../helpers/allSettledTypeGuard";

export enum NewsManagerEvents {
  NEW = "newNews",
  READY = "ready",
  // Node treats the event name "error" as fatal when nobody is listening.
  // A second failed feed used to emit that name after the one-shot boot
  // listener had already been removed, which exited the process.
  ERROR = "subscriptionError",
}

export function emitSubscriptionReport(
  emit: (event: string, message: string) => void,
  results: PromiseSettledResult<string>[]
) {
  const failed = results.filter(isRejected).map((result) => String(result.reason));
  const successful = results.length - failed.length;

  if (failed.length > 0) {
    const names = failed.join(", ");
    const message =
      successful > 0
        ? `Error subscribing to ${failed.length} ${
            failed.length === 1 ? "news feed" : "news feeds"
          }: ${names}.`
        : `Failure to subscribe to any News Feeds: ${names}.`;
    emit(NewsManagerEvents.ERROR, message);
  } else if (successful === 0) {
    emit(NewsManagerEvents.ERROR, "Failure to subscribe to any News Feeds.");
  }

  if (successful > 0) {
    emit(
      NewsManagerEvents.READY,
      `Successfully subscribed to ${successful}/${results.length} news feeds.`
    );
  }
}
