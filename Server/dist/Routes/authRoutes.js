/** @format */
import express from "express";
import { Registration } from "../Controller/auth/register.js";
import { Login } from "../Controller/auth/login.js";
import { user } from "../Controller/auth/user.js";
import { Middleware } from "../Middleware/AuthMiddleWare.js";
const authRoute = express.Router();
// Define the registration route
authRoute.post("/register", Registration);
authRoute.post("/login", Login);
authRoute.get("/user", Middleware, user);
export default authRoute;
