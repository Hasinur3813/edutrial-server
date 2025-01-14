import express from "express";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import jwt from "jsonwebtoken";

const authRouter = express.Router();
const userCollection = db.collection("users");

// user creation route

authRouter.post("/signup", async (req, res, next) => {
  const user = req.body;
  if (!user.email || !user.password) {
    return next({
      message: "Please provide email and password",
      statusCode: 400,
    });
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;

  try {
    const result = await userCollection.insertOne(user);

    res.status(200).send({
      error: false,
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// social login route
authRouter.post("/social-login", async (req, res, next) => {
  const userData = req.body;

  if (!userData.email || !userData.name) {
    return res.status(404).send({
      error: true,
      success: false,
      message: "Please provide valid data",
    });
  }

  try {
    let user = await userCollection.findOne({ email: userData.email });
    if (!user) {
      const result = await userCollection.insertOne(userData);
      res.status(200).send({
        error: false,
        success: true,
        message: "User created successfully",
        data: result,
      });
    }
    res.send({
      error: false,
      success: true,
      message: "User found",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// user logout route
authRouter.post("/logout", (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 0,
    });
    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    next(error);
  }
});

// jwt token generation route
authRouter.post("/jwt", async (req, res, next) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return next({
      message: "Please provide valid data",
      statusCode: 400,
    });
  }

  try {
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const token = jwt.sign({ email, name }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({
        success: true,
        error: false,
        message: "Token generated successfully",
      });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
