import { SiteListener } from "./SiteListener";

const starship = new SiteListener("https://www.spacex.com/vehicles/starship/", {
  interval: 15,
  cooldown: 600,
});

export default {
  starship,
};
