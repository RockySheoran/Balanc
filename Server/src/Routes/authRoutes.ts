/** @format */

import express, { Router } from "express"
import { Registration } from "../Controller/auth/register.js"
import { Check_Login, Login } from "../Controller/auth/login.js";
import { user } from "../Controller/auth/user.js";
import { Middleware } from "../Middleware/AuthMiddleWare.js";
import { forgetPassword } from "../Controller/auth/passwordForget.js";


const authRoute = express.Router()

// Define the registration route
authRoute.post("/register", Registration);
authRoute.post("/login", Login);
authRoute.post("/check/credentials", Check_Login)
authRoute.get("/user",Middleware ,user);
authRoute.post("/forget-password",forgetPassword)



export default authRoute
