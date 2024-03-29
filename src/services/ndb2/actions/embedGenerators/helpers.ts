import { PredictionLifeCycle } from "../../../../providers/ndb2-client";

export const getPredictedPrefix = (status: PredictionLifeCycle): string => {
  if (status === PredictionLifeCycle.RETIRED) {
    return `had predicted that...`;
  }

  if (status === PredictionLifeCycle.CLOSED) {
    return `predicted that...`;
  }

  if (status === PredictionLifeCycle.SUCCESSFUL) {
    return `successfully predicted that...`;
  }

  if (status === PredictionLifeCycle.FAILED) {
    return `unsuccessfully predicted that...`;
  }

  return `predicts that...`;
};
