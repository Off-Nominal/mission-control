import { Providers } from "../../providers";
import createWebooksRouter from "./webhooks";

export default function NDB2({ ndb2Bot, api, models }: Providers) {
  api.use(
    "/webhooks",
    createWebooksRouter(ndb2Bot, models.ndb2MsgSubscription)
  );
}
