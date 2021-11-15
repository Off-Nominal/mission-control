import { findTempsToConvert } from "../events/tempConvert/checker";

export default [
  {
    checker: findTempsToConvert,
    event: "tempConvert",
  },
];
