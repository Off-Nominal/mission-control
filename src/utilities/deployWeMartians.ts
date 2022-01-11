import axios from "axios";

const WM_DEPLOY_URL = process.env.WM_DEPLOY_URL;

export default function () {
  axios
    .post(WM_DEPLOY_URL)
    .catch((err) => console.error("Failed to deploy WeMartians Build.", err));
}
