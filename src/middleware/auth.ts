export default function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: "No credentials sent!" });
  }
  const auth = process.env.NDB2_CLIENT_ID;

  if (req.headers.authorization !== `Bearer ${auth}`) {
    return res.status(403).json({ error: "Invalid credentials" });
  }
  next();
}
