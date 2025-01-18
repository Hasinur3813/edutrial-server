import express from "express";
import { db } from "../config/db.js";
const userCollection = db.collection("users");

const usersRoute = express.Router();

usersRoute.get(`/role/:email`, async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    return res.status(404).send({
      error: true,
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "User is not found!",
      });
    }

    const userRole = user.role;

    res.status(200).send({
      error: false,
      success: true,
      message: "Success",
      data: { userRole },
    });
  } catch (error) {
    next(error);
  }
});

export default usersRoute;
