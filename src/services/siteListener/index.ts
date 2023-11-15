import { SiteListener } from "./SiteListener";

const starshipURL = "https://www.spacex.com/vehicles/starship/";

const starship = new SiteListener(starshipURL, {
  interval: 15,
  cooldown: 600,
});

starship.initialize();

export default {
  starship,
};
