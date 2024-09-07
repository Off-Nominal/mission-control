import { Providers } from "../../providers";

export default function HealthCheck({ api }: Providers) {
  api.get("/health", (req, res) => {
    res.status(200).send("OK");
  });
}
