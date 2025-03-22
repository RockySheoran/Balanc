import { Router } from "express";
import authRoute from "./auth.js";
const route = Router();
route.use("/api/auth", authRoute);
export default route;
