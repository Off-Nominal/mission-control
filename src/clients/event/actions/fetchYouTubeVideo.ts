import { google } from "googleapis";
import mcconfig from "../../../mcconfig";

export default async function fetchYouTubeVideo(id: string) {
  const youtube = google.youtube({
    version: "v3",
    auth: mcconfig.providers.youtube.key,
  });

  const results = await youtube.videos.list({
    part: ["snippet,liveStreamingDetails"],
    id: [id],
  });
  return await results.data.items;
}
