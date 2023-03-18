import express from "express";
const router = express.Router();

router.post("/ndb2", (req, res) => {
  res.json("thank u");
});

export default router;
