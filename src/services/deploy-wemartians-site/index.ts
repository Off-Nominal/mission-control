import axios from "axios";
import { Providers } from "../../providers";

function deploy(url: string) {
  axios
    .post(url)
    .catch((err) => console.error("Failed to deploy WeMartians Build.", err));
}

export default function DeployWeMartiansSite({
  rssProviders,
  mcconfig,
}: Providers) {
  rssProviders.wm.on("new", () => deploy(mcconfig.wemartians.deployUrl));
}
