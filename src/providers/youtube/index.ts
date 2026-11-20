import { youtube } from "@googleapis/youtube";
import mcconfig from "../../mcconfig";

const youtubeClient = youtube({
  version: "v3",
  auth: mcconfig.providers.youtube.key,
});

export default youtubeClient;
