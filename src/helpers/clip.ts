export const clip = (string: string, count: number): string => {
  return string.slice(count, string.length - count);
};
