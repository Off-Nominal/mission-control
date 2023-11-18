import mcconfig from "../../mcconfig";
import { SanityClient } from "@sanity/client";
export * from "./types";

const client = require("@sanity/client");
const imageUrlBuilder = require("@sanity/image-url");

export const sanityClient: SanityClient = client({
  projectId: mcconfig.providers.sanity.cmsId,
  dataset: mcconfig.providers.sanity.dataset || mcconfig.env || "development",
  apiVersion: "2022-06-24",
  useCdn: mcconfig.providers.sanity.cdn || true,
});

export const sanityImageUrlBuilder = imageUrlBuilder(sanityClient);
