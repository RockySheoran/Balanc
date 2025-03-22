/** @format */
import express from "express";
import { Registration } from "../Controller/auth/Auth.js";
import { verifyError } from "../Controller/auth/VerifyEmail.js";
const authRoute = express.Router();
// Define the registration route
authRoute.post("/register", Registration);
authRoute.get("/verify-error", verifyError);
export default authRoute;
