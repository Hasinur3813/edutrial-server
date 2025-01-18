import express from "express";

const teachersRoute = express.Router();
import verifyToken from "../middleware/verifyToken.js";
import { db } from "../config/db.js";

const teachersCollection = db.collection("teachers");

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
export default teachersRoute;
