export const filterWords = (words: string[], filters: string[]): string[] => {
  // Any message that begins with the filter strings will be filtered out.

  const filteredWords = words.filter((word) => {
    filters.forEach((start) => {
      if (word.startsWith(start)) {
        return true;
      }
    });

    return false;
  });

  return filteredWords;
};
