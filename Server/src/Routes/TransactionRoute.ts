/** @format */

// src/routes/transactionRoutes.ts
import express from "express"
import {
  createTransaction,
  getAllTransactions,
  getTransactionsByDate,
  getTransactionsByMonth,
  getTransactionsByYear,
} from "../Controller/Expense/Transaction.js"
import { Middleware } from "../Middleware/AuthMiddleWare.js"

const TransactionRouter = express.Router()

TransactionRouter.post("/createTransaction", Middleware, createTransaction)
TransactionRouter.post("/transactions",  getAllTransactions)
TransactionRouter.get("/date/:date", Middleware, getTransactionsByDate)
TransactionRouter.get("/month/:year/:month", Middleware, getTransactionsByMonth)
TransactionRouter.get("/year/:year", Middleware, getTransactionsByYear)

export default TransactionRouter
