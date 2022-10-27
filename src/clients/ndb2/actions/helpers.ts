export const formatOdds = (odds: number) => {
  const roundedOdds = Math.round(odds * 100) / 100;
  return roundedOdds.toString();
};
