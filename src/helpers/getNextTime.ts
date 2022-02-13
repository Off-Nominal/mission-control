import { add } from "date-fns";

type GetNextTimeOptions = {
  hour?: number;
  minute?: number;
  second?: number;
};

export default function getNextTime(options: GetNextTimeOptions): Date {
  const now = new Date();
  const nextDate = new Date();

  if (options.hour) {
    nextDate.setUTCHours(options.hour, 0, 0, 0);
    return now >= nextDate ? add(nextDate, { days: 1 }) : nextDate;
  }

  if (options.minute) {
    nextDate.setUTCMinutes(options.minute, 0, 0);
    return now >= nextDate ? add(nextDate, { hours: 1 }) : nextDate;
  }

  if (options.second) {
    nextDate.setUTCSeconds(options.second, 0);
    return now >= nextDate ? add(nextDate, { minutes: 1 }) : nextDate;
  }
}
