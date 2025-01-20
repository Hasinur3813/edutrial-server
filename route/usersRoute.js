import express from "express";
import { db } from "../config/db.js";
import verifyToken from "../middleware/verifyToken.js";
import { ObjectId, ReturnDocument } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET);
const userCollection = db.collection("users");
const classCollection = db.collection("classes");
const enrollCollection = db.collection("enrollments");
const assignmentCollection = db.collection("assignments");

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

// payment intent
usersRoute.post(
  "/create-payment-intent",
  verifyToken,
  async (req, res, next) => {
    const { amount, currency } = req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount * 100),
        currency,
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      next(error);
    }
  }
);

// keep enrollments data to database
usersRoute.post("/enrollments", verifyToken, async (req, res, next) => {
  const data = req.body;
  data.date = new Date();
  data.status = "enrolled";
  console.log(data);

  try {
    const result = await enrollCollection.insertOne(data);
    res.status(200).send({
      error: false,
      sucess: true,
      message: "Congrats! You have successfully enrolled the class",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// get all the enrolled classes for specific students

usersRoute.get("/enrolled-classes", async (req, res, next) => {
  const email = req.query?.email;
  if (!email) {
    return res.status(404).send("Required Data Not Found!");
  }
  try {
    const enrolledClasses = await enrollCollection
      .aggregate([
        {
          $match: {
            user: email,
            status: "enrolled",
          },
        },
        {
          $addFields: {
            classId: { $toObjectId: "$classId" },
          },
        },
        {
          $lookup: {
            from: "classes",
            localField: "classId",
            foreignField: "_id",
            as: "classDetails",
          },
        },
        {
          $unwind: "$classDetails",
        },
        {
          $replaceRoot: {
            newRoot: "$classDetails",
          },
        },
      ])
      .toArray();

    res.status(200).send({
      error: false,
      success: true,
      message: "Enrolled Classes",
      data: enrolledClasses,
    });
  } catch (error) {
    next(error);
  }
});

// get all the assignments for a specific class

usersRoute.get("/all-assignments/:id", verifyToken, async (req, res, next) => {
  const id = req.params?.id;
  try {
    const assignments = await assignmentCollection
      .find({ class_id: id })
      .toArray();

    res.status(200).send({
      error: false,
      succes: true,
      message: "All the assignments",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
});

// assignment submisstion

usersRoute.patch("/assignment-submission/:id", async (req, res, next) => {
  const id = req.params?.id;
  const query = { _id: new ObjectId(id) };
  const updateAssignment = {
    $inc: { submissions: 1 },
  };
  const options = { returnDocument: "after" };

  try {
    const result = await assignmentCollection.findOneAndUpdate(
      query,
      updateAssignment,
      options
    );
    console.log(result);
    res.send({
      success: true,
      error: false,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default usersRoute;
