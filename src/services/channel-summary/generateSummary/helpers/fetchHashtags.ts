export type HashtagCounter = {
  tag: string;
  count: number;
};

export const fetchHashtags = (text: string): HashtagCounter[] => {
  let startPoint: number = 0;
  let hashtags: HashtagCounter[] = [];

  const findTag = () => {
    const hashIndex = text.indexOf("#", startPoint);

    if (hashIndex === -1) {
      return;
    }

    const endIndex = text.indexOf(" ", hashIndex);

    if (endIndex === -1) {
      return;
    }

    const tag = text.substring(hashIndex, endIndex);

    const tagIndex = hashtags.findIndex((counter) => tag === counter.tag);

    if (tagIndex >= 0) {
      hashtags[tagIndex].count++;
    } else {
      hashtags.push({
        tag,
        count: 1,
      });
    }

    startPoint = endIndex;

    if (text.indexOf("#", startPoint) >= 0) {
      findTag();
    }
  };

  findTag();

  return hashtags;
};
