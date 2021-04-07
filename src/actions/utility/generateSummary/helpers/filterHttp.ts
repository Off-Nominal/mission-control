export const filterHttp = (text: string): string[] => {
  const words = text.split(" ");
  const filteredWords = words.filter((word) => {
    return !word.startsWith("http");
  });
  return filteredWords;
};
