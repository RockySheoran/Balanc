
import { Router } from "express";
import { Middleware } from "../Middleware/AuthMiddleWare.js";
import { AccountController } from "../Controller/Expense/UserAcount.js";


export const accountRoute = Router();
accountRoute.post("/createAccount", Middleware, AccountController.createAccount)
accountRoute.get("/getAccount", Middleware, AccountController.getUserAccount)
accountRoute.post("/accountDelete", AccountController.deleteAccount)