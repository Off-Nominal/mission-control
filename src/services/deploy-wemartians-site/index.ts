import axios from "axios";
import { Providers } from "../../providers";
import mcconfig from "../../mcconfig";

function deploy() {
  axios
    .post(mcconfig.wemartians.deployUrl)
    .catch((err) => console.error("Failed to deploy WeMartians Build.", err));
}

export default function DeployWeMartiansSite({ rssProviders }: Providers) {
  rssProviders.wm.on("new", deploy);
}
