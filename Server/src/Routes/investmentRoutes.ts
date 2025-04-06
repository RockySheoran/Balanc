/** @format */

import express from "express"
import {
  createInvestment,
  getAllInvestments,

} from "../Controller/Investment/investment.js"
import { Middleware } from "../Middleware/AuthMiddleWare.js"

const investmentRouter = express.Router()

// 🔐 Protect all routes

// 📩 Create Investment
investmentRouter.post("/createInvestment", Middleware, createInvestment)

// 📚 Get All Investments
investmentRouter.post("/getAllInvestments", getAllInvestments)


export default investmentRouter
