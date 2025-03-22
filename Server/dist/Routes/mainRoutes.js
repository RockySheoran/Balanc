import express from "express";
import authRoute from "./authRoutes.js";
import { emailVerify } from "./emailVerifyRoutes.js";
const route = express.Router();
route.use("/api/auth", authRoute);
route.use("/", emailVerify);
export default route;
