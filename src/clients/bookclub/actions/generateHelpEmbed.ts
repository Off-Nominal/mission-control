import { EmbedBuilder } from "discord.js";

export const generateHelpEmbed = () => {
  const embed: EmbedBuilder = new EmbedBuilder();

  embed
    .setColor("#3e7493")
    .setTitle("Book Club Bot Help")
    .setThumbnail(
      "https://res.cloudinary.com/dj5enq03a/image/upload/v1640446534/Discord%20Assets/onbc_oauth_logo_wijdlq.png"
    )
    .setDescription(
      "Book Club Bot can serve you recommendations for books in the Space Book Club application."
    )
    .addFields(
      {
        name: "Using the bot",
        value:
          "Type `/bookclub` into the message bar and the bot will serve you different options for getting a recommendation.",
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Random",
        value: "Gives you a random book from our collection.",
        inline: true,
      },
      {
        name: "Best",
        value:
          "Gives you the book with the highest user rating in the last 60 days.",
        inline: true,
      },
      {
        name: "Favourite",
        value: `Gives you the book with the most community favourites in the last 60 days. And yes, that's favourite with a "u". :flag_ca:`,
        inline: true,
      }
    );
  return embed;
};
