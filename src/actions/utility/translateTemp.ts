import { Message, MessageEmbed } from "discord.js";
import { parseCommands } from "../../helpers/parseCommands";

export type Unit = "c" | "f" | "C" | "F";

export type Temperature = {
  value: number;
  unit: Unit;
};

const isSplitUnit = (
  words: string[],
  index: number
): [number, Unit, boolean] => {
  const word = words[index];
  let value;
  let startingUnit;
  let error = true;

  if (index === 0) {
    return [value, startingUnit, error];
  }

  // Set Starting Unit if the unit is orphaned word
  if (word === "c") {
    startingUnit = "C";
  } else if (word === "f") {
    startingUnit = "F";
  }

  // Set value if number
  const previousWord = words[index - 1];
  const numberfiedWord = Number(previousWord);
  if (!isNaN(numberfiedWord)) {
    value = numberfiedWord;
    error = false;
  }
  return [value, startingUnit, error];
};

const isJoinedUnit = (
  words: string[],
  index: number
): [number, Unit, boolean] => {
  const word = words[index];
  let value;
  let startingUnit;
  let error = true;

  if (word.length < 2) {
    return [value, startingUnit, error];
  }

  if (word.endsWith("c")) {
    startingUnit = "C";
  } else if (word.endsWith("f")) {
    startingUnit = "F";
  }

  if (startingUnit) {
    const temperature = word.slice(0, word.length - 1);
    const numberfiedTemp = Number(temperature);

    if (!isNaN(numberfiedTemp)) {
      value = numberfiedTemp;
      error = false;
    }
  }

  return [value, startingUnit, error];
};

const trimPunctuation = (word: string): string => {
  const endsWithPunc = !!word.match(/[.,:!?"]$/);
  console.log(endsWithPunc);

  if (endsWithPunc) {
    return word.slice(0, word.length - 1);
  } else {
    return word;
  }
};

export const findTempsToConvert = (message: Message) => {
  const words = parseCommands(message, true);
  const trimmedWords = words.map(trimPunctuation);

  const tempsToConvert: Temperature[] = [];

  for (let i = 0; i < trimmedWords.length; i++) {
    // Block to check for Split Units in message (like "it was 46.1 C outside")
    {
      const [value, unit, error] = isSplitUnit(trimmedWords, i);
      if (!error) {
        tempsToConvert.push({
          value,
          unit,
        });
      }
    }

    // Block to check for Joined Units in message (like "it was 46.1C outside")
    {
      const [value, unit, error] = isJoinedUnit(trimmedWords, i);
      if (!error) {
        tempsToConvert.push({
          value,
          unit,
        });
      }
    }
  }

  return tempsToConvert;
};

const translateTemp = (temp: Temperature): Temperature => {
  if (temp.unit === "C") {
    const basis = (temp.value * 1.8 + 32) * 10;
    const value = Math.round(basis) / 10;
    return {
      value,
      unit: "F",
    };
  } else if (temp.unit === "F") {
    const basis = ((temp.value - 32) / 1.8) * 10;
    const value = Math.round(basis) / 10;
    return {
      value,
      unit: "C",
    };
  }
};

export const sendTemperatureConversions = async (
  message: Message,
  temps: Temperature[]
) => {
  const embed = new MessageEmbed();
  embed.setTitle("Temperature Converter");

  let description = "";

  temps.forEach((temp) => {
    const initialTemp = temp.value.toString().concat("°", temp.unit);

    const translation = translateTemp(temp);

    const newTemp = translation.value.toString().concat("°", translation.unit);

    description = description.concat(`${initialTemp} is ${newTemp}\n`);
  });

  embed.setDescription(description);

  try {
    await message.channel.send(embed);
  } catch (err) {
    console.error(err);
  }
};
