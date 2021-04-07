export const filterNumbers = (words: string[]): string[] => {
  // Any word that is just a number will be filtered out

  const filteredWords = words.filter((word) => {
    return isNaN(Number(word));
  });

  return filteredWords;
};
