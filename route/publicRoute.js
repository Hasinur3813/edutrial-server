import express from "express";

const publicRoute = express.Router();

publicRoute.get("/", (req, res) => {
  res.send("I am from public route");
});

export default publicRoute;
