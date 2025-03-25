/** @format */

import express from "express"
import {
  createInvestment,
  getAllInvestments,
  getInvestmentsByDate,
  getInvestmentsByMonth,
  getInvestmentsByYear,
} from "../Controller/Investment/investment.js"
import { Middleware } from "../Middleware/AuthMiddleWare.js"

const investmentRouter = express.Router()

// 🔐 Protect all routes

// 📩 Create Investment
investmentRouter.post("/createInvestment", Middleware, createInvestment)

// 📚 Get All Investments
investmentRouter.get("/getAllInvestments", Middleware, getAllInvestments)

// 📅 Get Investments by Buy Date
investmentRouter.get("/date/:buyDate", Middleware, getInvestmentsByDate)
investmentRouter.get("/year/:year", Middleware, getInvestmentsByYear)
investmentRouter.get(
  "/year/:year/month/:month",
  Middleware,
  getInvestmentsByMonth
)

export default investmentRouter
