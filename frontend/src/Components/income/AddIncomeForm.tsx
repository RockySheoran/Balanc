/** @format */
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/Components/ui/input"
import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Label } from "@/Components/ui/label"
import { Textarea } from "../ui/textarea"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { newTransactionAction } from "@/Actions/transactionActions/newTransactionAction"
import { addIncome } from "@/lib/Redux/features/income/incomeSlices"
import { addTransaction } from "@/lib/Redux/features/transactions/transactionsSlice"
import { Button } from "../ui/button"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"

const categories = ["Salary", "Freelance", "Investment", "Gift", "Other"]
const transactionTypes = ["CREDIT", "INCOME"]

const initialState = {
  message: "",
  status: 0,
  errors: {},
  data: {},
}

const AddIncomeForm = () => {
  const dispatch = useAppDispatch()
  const formRef = useRef<HTMLFormElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    newTransactionAction,
    initialState
  )
  const { selectedAccount } = useAppSelector((store) => store.account)

  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message, {
        position: "top-right",
        style: { background: "#fee2e2", color: "#b91c1c" },
      })
    } else if (state.status === 200) {
      toast.success(state.message, {
        position: "top-right",
        style: { background: "#dcfce7", color: "#166534" },
      })
      dispatch(addIncome(state.data.data.transaction))
      dispatch(addTransaction(state.data.data.transaction))
      setIsOpen(false)
      formRef.current?.reset()
    }
  }, [state, dispatch])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Add Income
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}>
              <DialogTitle className="text-2xl font-bold text-indigo-900">
                Add New Income
                <span className="block w-12 h-1 bg-indigo-500 mt-2 rounded-full"></span>
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          <form ref={formRef} action={formAction} className="space-y-4 mt-4">
            <input
              type="hidden"
              name="accountId"
              value={selectedAccount?.id || ""}
            />

            {/* Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}>
              <Label className="text-gray-700 font-medium">Name</Label>
              <Input
                placeholder="Income source"
                name="name"
                id="name"
                required
                className="mt-2 focus:ring-2 focus:ring-indigo-500"
              />
              <AnimatePresence>
                {state.errors?.name && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm mt-1 block">
                    {state.errors.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Amount Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}>
              <Label className="text-gray-700 font-medium">Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                name="amount"
                id="amount"
                step="0.01"
                min="0.01"
                required
                className="mt-2 focus:ring-2 focus:ring-indigo-500"
              />
              <AnimatePresence>
                {state.errors?.amount && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm mt-1 block">
                    {state.errors.amount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Type Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}>
              <Label className="text-gray-700 font-medium">Type</Label>
              <Select name="type" required>
                <SelectTrigger className="mt-2 focus:ring-2 focus:ring-indigo-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AnimatePresence>
                {state.errors?.type && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm mt-1 block">
                    {state.errors.type}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Category Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}>
              <Label className="text-gray-700 font-medium">Category</Label>
              <Select name="category" required>
                <SelectTrigger className="mt-2 focus:ring-2 focus:ring-indigo-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AnimatePresence>
                {state.errors?.category && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm mt-1 block">
                    {state.errors.category}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Description Field */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}>
              <Label className="text-gray-700 font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                className="mt-2 focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="pt-2">
              <Button
                type="submit"
                className={`w-full py-3 text-lg font-medium transition-all duration-300 ${
                  isPending
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200"
                }`}
                disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    Add Income
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

export default AddIncomeForm
