import { google } from "googleapis";

export default async function fetchYouTubeVideo(id: string) {
  const youtube = google.youtube({
    version: "v3",
    auth: process.env.YT_API_KEY,
  });

  const results = await youtube.videos.list({
    part: ["snippet,liveStreamingDetails"],
    id: [id],
  });
  return await results.data.items;
}
