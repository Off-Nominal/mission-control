export const truncateText = (
  text: string | undefined,
  limit: number
): string => {
  if (!text || text.length <= limit) {
    return text;
  } else {
    return text.slice(0, limit - 3) + "...";
  }
};
