export const filterWords = (words: string[]): string[] => {
  const filteredWordStarts = ["http", "@"]; // Any message that begins with these strings will be filtered out.

  const filteredWords = words.filter((word) => {
    filteredWordStarts.forEach((start) => {
      if (word.startsWith(start)) {
        return true;
      }
    });

    return false;
  });

  return filteredWords;
};
