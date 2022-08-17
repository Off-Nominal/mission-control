import { format } from "date-fns";
import { EmbedBuilder } from "discord.js";
import { ContentFeedItem } from "../handlers/handleNewContent";

export const createSearchResultsEmbed = (
  results: Fuse.default.FuseResult<ContentFeedItem>[],
  title: string,
  image: string,
  searchTerm: string
) => {
  return new EmbedBuilder()
    .setColor("#3e7493")
    .setTitle("Search Results")
    .setAuthor({ name: title })
    .setThumbnail(image)
    .setDescription(`Top three results for your search \`${searchTerm}\``)
    .addFields(
      results.map((result) => {
        const { description, summary, title, url, date } = result.item;
        const desc =
          description?.slice(0, 160) + "..." || summary.split("\n")[0];

        return {
          name: title,
          value: desc + `\n[[Link]](${url}) - ${format(date, "PPP")}`,
        };
      })
    );
};
