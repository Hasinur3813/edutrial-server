import express from "express";

const teachersRoute = express.Router();
import verifyToken from "../middleware/verifyToken.js";
import { db } from "../config/db.js";
import verifyTeacher from "../middleware/verifyTeacher.js";
import { ObjectId } from "mongodb";

const teachersCollection = db.collection("teachers");
const classCollection = db.collection("classes");
const assignmentCollection = db.collection("assignments");
const enrollCollection = db.collection("enrollments");

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
          $set: data,
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
    const teacherClass = req.body;
    if (!teacherClass) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "Required data not found!",
      });
    }

    // add status pending by default
    teacherClass.status = "pending";
    teacherClass.enrollments = 0;

    try {
      const result = await classCollection.insertOne(teacherClass);

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

teachersRoute.post(
  "/all-classes/:email",
  verifyToken,
  verifyTeacher,
  async (req, res, next) => {
    const email = req.params.email;
    const { currentPage, pageSize } = req.body;
    const page = parseInt(currentPage) || 1;
    const limit = parseInt(pageSize) || 10;
    const skip = (page - 1) * limit;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or update data",
      });
    }

    try {
      const result = await classCollection
        .find({ email })
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalClass = await classCollection.countDocuments({ email });

      res.status(200).send({
        totalClass,
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

// delete teachers class
teachersRoute.delete(
  "/delete-class/:id",
  verifyToken,
  verifyTeacher,
  async (req, res, next) => {
    const id = req.params?.id;
    console.log(id);

    if (!id) {
      return res.status(404).send({
        error: true,
        success: false,
        message: "Required data not found",
      });
    }

    try {
      const result = await classCollection.deleteOne({ _id: new ObjectId(id) });
      res.status(200).send({
        error: false,
        success: true,
        message: "Sucessfully deleted the class",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// add assignmet for specific class
teachersRoute.post(
  "/add-assignment",
  verifyToken,
  verifyTeacher,
  async (req, res, next) => {
    const data = req.body;
    if (!data) {
      return res.status(404).send({
        message: "Data required!",
      });
    }

    data.createdAt = new Date();
    data.submissions = 0;

    try {
      const result = await assignmentCollection.insertOne(data);
      res.status(200).send({
        error: false,
        success: true,
        message: "Assignment created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// get specific class stats
teachersRoute.get("/class-stats/:id", async (req, res, next) => {
  const classId = req.params?.id;

  try {
    const totalAssignments = await assignmentCollection
      .find({
        class_id: classId,
      })
      .toArray();
    const totalEnrollments = await enrollCollection.countDocuments({
      classId,
    });

    const totalSubmissions = totalAssignments.reduce((accum, assignment) => {
      return accum + assignment.submissions;
    }, 0);

    res.status(200).send({
      success: true,
      data: {
        totalAssignments: totalAssignments.length,
        totalEnrollments,
        totalSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default teachersRoute;
