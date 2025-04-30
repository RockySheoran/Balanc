/** @format */

// src/routes/transactionRoutes.ts
import express from "express"

import { Middleware } from "../Middleware/AuthMiddleWare.js"
import { TransactionController } from "../Controller/Transaction_Account/Transaction.js"

const TransactionRouter = express.Router()

TransactionRouter.post(
  "/createTransaction",
  Middleware,
  TransactionController.createTransaction
)
TransactionRouter.post(
  "/transactions",
  TransactionController.getAllTransactions
)
TransactionRouter.post(
  "/deleteTransaction",
  Middleware,
  TransactionController.deleteTransaction
)
TransactionRouter.post(
  "/updateTransaction",
  Middleware,
  TransactionController.updateTransaction
)

export default TransactionRouter
