import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import publicRoute from "./route/publicRoute.js";
import notRouteFound from "./middleware/noRouteFound.js";
import globalErrorHandle from "./middleware/globalErrorHandle.js";

const port = process.env.PORT || 5000;
const app = express();
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/public", publicRoute);

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
