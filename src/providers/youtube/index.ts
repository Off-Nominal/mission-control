import { google } from "googleapis";
import mcconfig from "../../mcconfig";

const youtube = google.youtube({
  version: "v3",
  auth: mcconfig.providers.youtube.key,
});

export default youtube;
