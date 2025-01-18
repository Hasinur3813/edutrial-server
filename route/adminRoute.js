import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import { db } from "../config/db.js";

const adminRoute = express.Router();
const teachersCollection = db.collection("teachers");
const userCollection = db.collection("users");

adminRoute.get(
  "/teachers",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const cursor = teachersCollection.find();
      const teachers = await cursor.toArray();
      res.status(200).send({
        success: true,
        error: false,
        message: "Operation successfull",
        data: teachers,
      });
    } catch (error) {
      next(error);
    }
  }
);

// approve teacher request
adminRoute.patch(
  "/approve-teacher-request",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const email = req.body?.email;
    if (!email) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "Required data is not found!",
      });
    }

    const query = { email: email };
    const updateTeacher = {
      $set: {
        status: "approved",
      },
    };

    const updateUser = {
      $set: {
        role: "teacher",
      },
    };
    try {
      const result = await teachersCollection.updateOne(query, updateTeacher);
      await userCollection.updateOne(query, updateUser);

      res.status(200).send({
        error: false,
        success: true,
        message: "Operation successfull",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// reject teacher request

adminRoute.patch(
  "/reject-teacher-request",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const email = req.body?.email;
    if (!email) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "Required data is not found!",
      });
    }

    const query = { email: email };
    const updateTeacher = {
      $set: {
        status: "rejected",
      },
    };
    try {
      const result = await teachersCollection.updateOne(query, updateTeacher);

      res.status(200).send({
        error: false,
        success: true,
        message: "Operation successfull",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// get all the users available in the database

adminRoute.get(
  "/all-users",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const users = await userCollection.find().toArray();
      res.status(200).send({
        success: true,
        error: false,
        message: "all users",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
);

// make admin  to users
adminRoute.patch(
  "/make-admin/:email",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const email = req.params?.email;
    if (!email) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "Required data is not found!",
      });
    }

    const query = { email };
    const updateUser = {
      $set: {
        role: "admin",
      },
    };

    try {
      const result = await userCollection.updateOne(query, updateUser);
      res.status(200).send({
        success: true,
        error: false,
        message: "Successfully made the user as Admin",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// get users by search

adminRoute.get("/users", verifyToken, verifyAdmin, async (req, res, next) => {
  const value = req.query?.search;

  const query = {
    $or: [
      { name: { $regex: value, $options: "i" } },
      { email: { $regex: value, $options: "i" } },
    ],
  };
  try {
    const result = await userCollection.find(query).toArray();
    res.status(200).send({
      error: false,
      sucess: true,
      message: "Users by search",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default adminRoute;
