import express from "express";
import { db } from "../config/db.js";
import verifyToken from "../middleware/verifyToken.js";
import { ObjectId } from "mongodb";
const userCollection = db.collection("users");
const classCollection = db.collection("classes");

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

// get all the classes
usersRoute.get("/all-classes", async (req, res, next) => {
  try {
    const result = await classCollection.find({ status: "accepted" }).toArray();
    res.status(200).send({
      error: false,
      success: true,
      message: "All the classes created by teachers",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// get a single class
usersRoute.get("/single-class", async (req, res, next) => {
  const id = req.query.id;
  console.log(id);

  try {
    const result = await classCollection.findOne({ _id: new ObjectId(id) });
    res.status(200).send({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default usersRoute;
