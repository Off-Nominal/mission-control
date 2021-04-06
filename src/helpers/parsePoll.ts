import { Message } from "discord.js";

export const parsePoll = (message: Message) => {
  const text = message.content;

  const options: string[] = [];

  const leftBracketCount = (text.match(/\[/g) || []).length;
  const rightBracketCount = (text.match(/\]/g) || []).length;
  const leftCurlyCount = (text.match(/\{/g) || []).length;
  const rightCurlyCount = (text.match(/\}/g) || []).length;

  const returnObj = {
    question: "",
    options,
  };

  if (
    leftBracketCount !== rightBracketCount ||
    leftBracketCount === 0 ||
    rightBracketCount === 0 ||
    leftCurlyCount !== 1 ||
    rightCurlyCount !== 1
  ) {
    return returnObj;
  }

  const qStart = text.indexOf("{");
  const qEnd = text.indexOf("}", qStart);
  returnObj.question = text.slice(qStart + 1, qEnd);

  let startPoint = qEnd;

  const optionGrabber = () => {
    let oStart = text.indexOf("[", startPoint);
    let oEnd = text.indexOf("]", oStart);

    const option = text.substring(oStart + 1, oEnd);
    options.push(option);
    startPoint = oEnd;

    if (text.indexOf("[", startPoint) > 0) {
      optionGrabber();
    } else {
      return;
    }
  };

  optionGrabber();

  return returnObj;
};
