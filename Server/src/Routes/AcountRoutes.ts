/** @format */

import { Router } from "express"
import { Middleware } from "../Middleware/AuthMiddleWare.js"
import { AccountController } from "../Controller/Transaction_Account/UserAcount.js"

export const accountRoute = Router()
accountRoute.post("/createAccount", Middleware, AccountController.createAccount)
accountRoute.get("/getAccount", Middleware, AccountController.getUserAccount)
accountRoute.post("/accountDelete", Middleware, AccountController.deleteAccount)
