/** @format */

// src/routes/transactionRoutes.ts
import express from "express"
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,

} from "../Controller/Expense/Transaction.js"
import { Middleware } from "../Middleware/AuthMiddleWare.js"

const TransactionRouter = express.Router()

TransactionRouter.post("/createTransaction", Middleware, createTransaction)
TransactionRouter.post("/transactions",  getAllTransactions)
TransactionRouter.post("/deleteTransaction",Middleware, deleteTransaction)


export default TransactionRouter
