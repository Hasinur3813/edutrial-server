import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import teachersRoute from "./route/teachersRoute.js";
import notRouteFound from "./middleware/noRouteFound.js";
import globalErrorHandle from "./middleware/globalErrorHandle.js";
import authRoute from "./route/authRoute.js";
import connectDB from "./config/db.js";
import adminRoute from "./route/adminRoute.js";
import usersRoute from "./route/usersRoute.js";

const port = process.env.PORT || 3000;
const app = express();
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fir-learning-793eb.web.app",
      "https://fir-learning-793eb.firebaseapp.com",
    ],
    credentials: true,
  })
);

connectDB().catch(console.error);

app.use("/teachers", teachersRoute);
app.use("/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/users", usersRoute);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// middleware to handle 404 error
app.use(notRouteFound);

// middleware for global error handling
app.use(globalErrorHandle);

// create a server and listen on the port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
