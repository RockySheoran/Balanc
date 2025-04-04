/** @format */

// src/routes/transactionRoutes.ts
import express from "express"
import {
  createTransaction,
  getAllTransactions,

} from "../Controller/Expense/Transaction.js"
import { Middleware } from "../Middleware/AuthMiddleWare.js"

const TransactionRouter = express.Router()

TransactionRouter.post("/createTransaction", Middleware, createTransaction)
TransactionRouter.post("/transactions",  getAllTransactions)


export default TransactionRouter
