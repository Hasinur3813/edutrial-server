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
const feedbackCollection = db.collection("feedback");

const usersRoute = express.Router();

usersRoute.get(`/role/:email`, verifyToken, async (req, res, next) => {
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const result = await classCollection
      .find({ status: "accepted" })
      .skip(skip)
      .limit(limit)
      .toArray();
    const totalClasses = await classCollection.countDocuments();
    res.status(200).send({
      error: false,
      success: true,
      message: "All the classes created by teachers",
      totalClasses,
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
  data.enrollments = 0;

  const { classId } = data;
  const query = { _id: new ObjectId(classId) };
  const updataClass = {
    $inc: { enrollments: 1 },
  };

  try {
    const result = await enrollCollection.insertOne(data);
    await classCollection.findOneAndUpdate(query, updataClass);
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

usersRoute.post("/enrolled-classes", verifyToken, async (req, res, next) => {
  const email = req.query?.email;
  const { currentPage, pageSize } = req.body;
  const page = parseInt(currentPage) || 1;
  const limit = parseInt(pageSize) || 10;
  const skip = (page - 1) * limit;

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
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalClasses = await enrollCollection.countDocuments({ user: email });

    res.status(200).send({
      error: false,
      success: true,
      message: "Enrolled Classes",
      data: enrolledClasses,
      totalClasses,
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

usersRoute.patch(
  "/assignment-submission/:id",
  verifyToken,
  async (req, res, next) => {
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

      res.send({
        success: true,
        error: false,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// class feedback
usersRoute.post("/feedback", verifyToken, async (req, res, next) => {
  const feedback = req.body;
  if (!feedback) {
    return res.status(404).send({
      error: true,
      success: false,
      message: "Feedback is required!",
    });
  }

  try {
    const result = await feedbackCollection.insertOne(feedback);
    res.status(200).send({
      error: false,
      success: true,
      message: "Successfully submitted feedback",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// search classes
usersRoute.get("/classes", async (req, res, next) => {
  const value = req.query.search;
  const query = {
    $or: [
      { title: { $regex: value, $options: "i" } },
      { description: { $regex: value, $options: "i" } },
    ],
  };
  try {
    const result = await classCollection.find(query).toArray();
    res.status(200).send({
      error: false,
      sucess: true,
      message: "Classes by search",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// get some classes for homepaga
usersRoute.get("/homepage-classes", async (req, res, next) => {
  try {
    const result = await classCollection
      .find({ status: "accepted" })
      .limit(5)
      .toArray();
    res.status(200).send({
      error: false,
      success: true,
      message: "Some classes for homepage",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// get homepage stats
usersRoute.get("/homepage-stats", async (req, res, next) => {
  try {
    const totalClasses = await classCollection.countDocuments({
      status: "accepted",
    });
    const totalUsers = await userCollection.countDocuments();
    const totalEnrollments = await enrollCollection.countDocuments();
    res.status(200).send({
      error: false,
      success: true,
      message: "Homepage stats",
      data: { totalClasses, totalUsers, totalEnrollments },
    });
  } catch (error) {
    next(error);
  }
});
export default usersRoute;
