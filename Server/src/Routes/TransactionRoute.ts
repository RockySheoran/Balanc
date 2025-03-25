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

const TransactionRouter = express.Router()

TransactionRouter.post("/createTransaction", createTransaction)
TransactionRouter.get("/transactions", getAllTransactions)
TransactionRouter.get("/transactions/date/:date", getTransactionsByDate)
TransactionRouter.get("/transactions/month/:year/:month", getTransactionsByMonth)
TransactionRouter.get("/transactions/year/:year", getTransactionsByYear)

export default TransactionRouter
