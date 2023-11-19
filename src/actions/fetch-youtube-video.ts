import { youtube_v3 } from "googleapis";

export default async function fetchYouTubeVideo(
  client: youtube_v3.Youtube,
  id: string
) {
  const results = await client.videos.list({
    part: ["snippet,liveStreamingDetails"],
    id: [id],
  });
  return await results.data.items;
}
