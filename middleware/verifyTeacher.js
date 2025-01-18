import { db } from "../config/db.js";
const userCollection = db.collection("users");

const verifyTeacher = async (req, res, next) => {
  const { email } = req.user;

  try {
    const user = await userCollection.findOne({ email });
    const userRole = user.role;

    if (userRole === "teacher") {
      next();
    } else {
      res.status(403).send({
        error: true,
        success: false,
        message: "Forbidden access is denied!",
      });
    }
  } catch (error) {
    next(error);
  }
};

export default verifyTeacher;
