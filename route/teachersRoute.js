import express from "express";

const teachersRoute = express.Router();
import verifyToken from "../middleware/verifyToken.js";
import { db } from "../config/db.js";
import verifyTeacher from "../middleware/verifyTeacher.js";

const teachersCollection = db.collection("teachers");
const classCollection = db.collection("classes");

// submit teacher request
teachersRoute.post("/request", verifyToken, async (req, res, next) => {
  const data = req.body;
  const { email } = req.user;

  if (email !== data.email) {
    return res.status(403).send({
      error: true,
      success: false,
      message: "Unauthenticated user",
    });
  }

  // set teacher role as "pending" by default
  data.status = "pending";

  try {
    const isTeacherExist = await teachersCollection.findOne({ email });

    if (isTeacherExist && isTeacherExist.status === "rejected") {
      const result = await teachersCollection.updateOne(
        { email },
        {
          $set: { status: "pending" },
        },
        { upsert: true }
      );

      return res.status(200).json({
        error: false,
        success: true,
        data: result,
        message: "Successfully submitted teacher request!",
      });
    }

    const result = await teachersCollection.insertOne(data);

    res.status(200).json({
      error: false,
      success: true,
      data: result,
      message: "Successfully submitted teacher request!",
    });
  } catch (error) {
    next(error);
  }
});

// find teacher status
teachersRoute.get("/status/:email", verifyToken, async (req, res, next) => {
  const email = req.params.email;

  if (email !== req.user.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const query = { email: email };

  try {
    const teacher = await teachersCollection.findOne(query);
    res.send({
      status: teacher.status,
    });
  } catch (error) {
    next(error);
  }
});

// add class by teacher
teachersRoute.post(
  "/add-class",
  verifyToken,
  verifyTeacher,
  async (req, res, next) => {
    const teacher = req.body;
    if (!teacher) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "Required data not found!",
      });
    }

    // add status pending by default
    teacher.status = "pending";

    try {
      const result = await classCollection.insertOne(teacher);

      res.status(200).send({
        error: false,
        success: true,
        message: "Data inserted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// get all classes

teachersRoute.get(
  "/all-classes/:email",
  verifyToken,
  verifyTeacher,
  async (req, res, next) => {
    const email = req.params.email;
    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or update data",
      });
    }

    try {
      const result = await classCollection.find({ email }).toArray();
      res.status(200).send({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// update class
teachersRoute.patch(
  "/update-class/:email",
  verifyToken,
  verifyTeacher,
  async (req, res, next) => {
    const email = req.params?.email;
    const data = req.body;

    if (!email || !data) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or update data",
      });
    }

    try {
      const result = await classCollection.findOneAndUpdate(
        { email },
        {
          $set: data,
        },
        {
          returnDocument: "after",
        }
      );
      if (!result) {
        return res.status(404).send({
          success: false,
          message: "Class not found",
        });
      }

      res.status(200).send({
        success: true,
        message: "Class updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default teachersRoute;
