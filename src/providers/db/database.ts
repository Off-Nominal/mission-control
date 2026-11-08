import type { QueryResult, QueryResultRow } from "pg";

export interface Database {
  query<R extends QueryResultRow = any>(
    queryText: string,
    values?: any[],
  ): Promise<QueryResult<R>>;
}

type Disconnectable = {
  on(event: "error", listener: (err: Error) => void): void;
  query(queryText: string, values?: any[]): Promise<any>;
};

// pg.Client cannot be connected again after the server drops it, and an
// unhandled "error" event exits the process. This keeps one live client and
// opens a replacement the next time a query runs.
export function createResilientDatabase<T extends Disconnectable>(options: {
  open: () => T;
  connect: (client: T) => Promise<void>;
  onDisconnect?: (err: Error) => void;
}): Database {
  let active: T | null = null;
  let opening: Promise<T> | null = null;

  const client = (): Promise<T> => {
    if (active) return Promise.resolve(active);
    if (opening) return opening;

    const next = options.open();
    next.on("error", (err) => {
      if (active === next) active = null;
      options.onDisconnect?.(err);
    });

    opening = options
      .connect(next)
      .then(() => {
        active = next;
        opening = null;
        return next;
      })
      .catch((err) => {
        opening = null;
        throw err;
      });

    return opening;
  };

  return {
    query(queryText, values) {
      return client().then((current) => current.query(queryText, values));
    },
  };
}
