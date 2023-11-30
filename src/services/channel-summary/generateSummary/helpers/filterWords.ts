export const filterWords = (words: string[], filters: string[]): string[] => {
  // Any message that begins with the filter strings will be filtered out.

  const filteredWords = words.filter((word) => {
    let keepWord = true;

    filters.forEach((start) => {
      if (word.startsWith(start)) {
        keepWord = false;
        return;
      }
    });

    return keepWord;
  });

  return filteredWords;
};
