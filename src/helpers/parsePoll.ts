import { Message } from "discord.js";

export const parsePoll = (message: Message) => {
  const text = message.content;

  const params = [];

  const qStart = text.indexOf("{") + 1;
  const qEnd = text.indexOf("}", qStart);
  const pollQuestion = text.slice(qStart, qEnd);
  params.push(pollQuestion);

  let startPoint = qEnd;

  const optionGrabber = () => {
    const oStart = text.indexOf("[", startPoint);
    const oEnd = text.indexOf("]", oStart) + 1;
    const option = text.slice(oStart, oEnd);
    params.push(option);
    startPoint = oEnd;

    if (text.indexOf("[", startPoint) > 0) {
      optionGrabber();
    } else {
      return;
    }
  };

  optionGrabber();

  return params;
};
