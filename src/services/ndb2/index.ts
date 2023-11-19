import { Providers } from "../../providers";
import createWebooksRouter from "./webhooks";

export default function NDB2({ ndb2Bot, api }: Providers) {
  api.use("/webhooks", createWebooksRouter(ndb2Bot));
}
