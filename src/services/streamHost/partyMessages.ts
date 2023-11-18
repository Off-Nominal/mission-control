import {
  GuildMember,
  GuildScheduledEvent,
  EmbedBuilder,
  GuildScheduledEventStatus,
} from "discord.js";
import { sanityClient } from "../../utilities/sanity";

type SanityMessage = {
  message: string;
  force: boolean;
  timestamp: number;
};

export type PartyMessage = {
  text: string;
  waitTime: number;
};

export type TitleSuggestion = {
  title: string;
  suggester: GuildMember;
};

export const generatePartyMessages = (
  event: GuildScheduledEvent<GuildScheduledEventStatus.Active>
): Promise<PartyMessage[]> => {
  const standardMessages: PartyMessage[] = [
    {
      text: `Welcome to the stream for ${event.name}! I'll be your host for this event. Let's see if we can't spice things up a little today!`,
      waitTime: 0,
    },
  ];

  const query = '*[_type == "eventPartyMessages"]';

  return sanityClient
    .fetch<SanityMessage[]>(query)
    .then((messages) => {
      const chosenMessages = messages.filter(
        (msg) => msg.force || Math.random() > 0.4
      );

      const timedChosenMessages: PartyMessage[] = chosenMessages.map((msg) => {
        const waitTime = msg.timestamp || Math.random() * 50 + 5; // 5-55 minutes
        return {
          text: msg.message,
          waitTime,
        };
      });

      return [...standardMessages, ...timedChosenMessages];
    })
    .catch((err) => {
      console.error("Unable to fetch Party Messages from CMS", err);
      return [...standardMessages];
    });
};

export const streamTitleEmbed = new EmbedBuilder({
  title: "Help pick an episode title!",
  description:
    "Throughout the stream, you can suggest episode titles here in the chat. I'll aggregate these, and at the end of the stream, you can vote on your favourite.",
  fields: [
    {
      name: "Suggesting a title",
      value: "To suggest a title, use the command `/events suggest <title>`",
    },
    {
      name: "Voting on a title",
      value:
        "At the end of the episode, I'll put all the titles in the chat and you can vote with emojies on your favourite.",
    },
    {
      name: "Cool, will Anthony and Jake abide by the results of the vote?",
      value: "LOL like they'd give you that much power!",
    },
  ],
});
