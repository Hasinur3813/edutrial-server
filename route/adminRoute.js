import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import { db } from "../config/db.js";
import { ObjectId } from "mongodb";
const adminRoute = express.Router();

const teachersCollection = db.collection("teachers");
const userCollection = db.collection("users");
const classCollection = db.collection("classes");
const enrollmentCollection = db.collection("enrollments");

adminRoute.get(
  "/teachers",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
      const teachers = await teachersCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalTeachers = await teachersCollection.countDocuments();

      res.status(200).send({
        success: true,
        error: false,
        totalTeachers,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
      const users = await userCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalUsers = await userCollection.countDocuments();
      res.status(200).send({
        success: true,
        error: false,
        totalUsers,
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

// get all the classes created by teachers

adminRoute.get(
  "/teachers-classes",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
      const result = await classCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalClasses = await classCollection.countDocuments();
      res.status(200).send({
        error: false,
        success: true,
        totalClasses,
        message: "All the classes created by teachers",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// approve teacher classes
adminRoute.patch(
  "/approve-teacher-class/:id",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const id = req.params?.id;
    if (!id) {
      return res.status(404).send({
        message: "Required data not found",
      });
    }

    const query = { _id: new ObjectId(id) };
    const updateClass = {
      $set: {
        status: "accepted",
      },
    };
    try {
      const result = await classCollection.findOneAndUpdate(
        query,
        updateClass,
        { returnDocument: "after" }
      );
      if (!result?.status) {
        return res.status(404).send({
          error: true,
          success: false,
          message: "It seems the class is not exist!",
        });
      }
      res.send({
        error: false,
        success: true,
        message: "The class has been accepted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);
// reject teacher classes
adminRoute.patch(
  "/reject-teacher-class/:id",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const id = req.params?.id;
    if (!id) {
      return res.status(404).send({
        message: "Required data not found",
      });
    }

    const query = { _id: new ObjectId(id) };
    const updateClass = {
      $set: {
        status: "rejected",
      },
    };
    try {
      const result = await classCollection.findOneAndUpdate(
        query,
        updateClass,
        { returnDocument: "after" }
      );
      if (!result?.status) {
        return res.status(404).send({
          error: true,
          success: false,
          message: "It seems the class is not exist!",
        });
      }
      res.send({
        error: false,
        success: true,
        message: "The class has been accepted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// get overall statistics
adminRoute.get(
  "/statistics",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const totalClasses = await classCollection.countDocuments();
      const totalEnrollments = await enrollmentCollection.countDocuments();
      const totalUsers = await userCollection.countDocuments();
      const totalTeachers = await userCollection
        .find({ role: "teacher" })
        .toArray();
      const totalStudents = await userCollection
        .find({ role: "student" })
        .toArray();
      const totalAdmins = await userCollection
        .find({ role: "admin" })
        .toArray();

      // get enrollments trends
      const enrollmentData = await enrollmentCollection
        .aggregate([
          {
            $group: {
              _id: {
                month: { $dateToString: { format: "%b", date: "$date" } },
              },
              enrollments: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              month: "$_id.month",
              enrollments: 1,
            },
          },
        ])
        .toArray();

      res.status(200).send({
        success: true,
        error: false,
        message: "Statistics",
        data: {
          totalClasses,
          totalEnrollments,
          userDemographics: [
            { name: "Students", value: totalStudents.length },
            { name: "Users", value: totalUsers },
            { name: "Educators", value: totalTeachers.length },
            { name: "Admins", value: totalAdmins.length },
          ],
          enrollmentData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default adminRoute;
