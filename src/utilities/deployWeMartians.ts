import axios from "axios";
import mcconfig from "../mcconfig";

export default function () {
  axios
    .post(mcconfig.wemartians.deployUrl)
    .catch((err) => console.error("Failed to deploy WeMartians Build.", err));
}
