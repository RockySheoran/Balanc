import express,{ Router } from "express";
import authRoute from "./authRoutes.js";
import { emailVerify } from "./emailVerifyRoutes.js";
import { authlimiter } from "../Config/rateLimit.js";

const route =express.Router();

route.use("/api/auth",authlimiter,authRoute);
route.use("/",emailVerify);

export default route;