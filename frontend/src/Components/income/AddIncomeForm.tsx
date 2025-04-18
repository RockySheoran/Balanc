/** @format */
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useActionState, useEffect, useRef, useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { newTransactionAction } from "@/Actions/transactionActions/newTransactionAction"


import { addIncome } from "@/lib/Redux/features/income/incomeSlices"
import { addTransaction } from "@/lib/Redux/features/transactions/transactionsSlice"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { updateAccount } from "@/lib/Redux/features/account/accountSlice"

const AddIncomeForm = () => {
  const dispatch = useAppDispatch()
  const formRef = useRef<HTMLFormElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { token, selectedAccount } = useAppSelector((state) => ({
    token: state.user.token,
    selectedAccount: state.account.selectedAccount,
  }))

  const [state, formAction, isPending] = useActionState(newTransactionAction, {
    message: "",
    status: 0,
    errors: {},
    data: {},
  })

  // Memoized constants
  const categories = useMemo(
    () => ["Salary", "Freelance", "Investment", "Gift", "Other"],
    []
  )
  const transactionTypes = useMemo(() => ["CREDIT", "INCOME"], [])

  // Handle form state changes
  useEffect(() => {
    if (!isOpen && formRef.current) {
      formRef.current.reset()
    }
  }, [isOpen])

  // Also modify your success handler to reset the form immediately
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
      dispatch(updateAccount(state.data.data.updatedAccount))

      // Reset form immediately
      if (formRef.current) {
        formRef.current.reset()
      }

      setIsOpen(false)
    }
  }, [state, dispatch])

  const handleFormAction = useCallback(
    (formData: FormData) => {
      return formAction({ formData, token: token || "" })
    },
    [formAction, token]
  )

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1 + i * 0.05,
        duration: 0.3,
      },
    }),
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 cursor-pointer hover:bg-indigo-700" asChild>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            Add Income
          </motion.div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible">
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}>
              <DialogTitle className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                Add New Income
                <span className="block w-12 h-1 bg-indigo-500 mt-2 rounded-full"></span>
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          <form
            ref={formRef}
            action={handleFormAction}
            className="space-y-4 mt-4">
            <input
              type="hidden"
              name="accountId"
              value={selectedAccount?.id || ""}
            />

            {/* Name Field */}
            <motion.div
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible">
              <Label className="text-gray-700 dark:text-gray-300 font-medium">
                Name
              </Label>
              <Input
                placeholder="Income source"
                name="name"
                id="name"
                required
                className="mt-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
              custom={1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible">
              <Label className="text-gray-700 dark:text-gray-300 font-medium">
                Amount
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                name="amount"
                id="amount"
                step="0.01"
                min="0.01"
                required
                className="mt-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="visible">
              <Label className="text-gray-700 dark:text-gray-300 font-medium">
                Type
              </Label>
              <Select name="type" required>
                <SelectTrigger className="mt-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
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
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="visible">
              <Label className="text-gray-700 dark:text-gray-300 font-medium">
                Category
              </Label>
              <Select name="category" required>
                <SelectTrigger className="mt-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400">
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
              custom={4}
              variants={fieldVariants}
              initial="hidden"
              animate="visible">
              <Label className="text-gray-700 dark:text-gray-300 font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                className="mt-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 min-h-[100px]"
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              custom={5}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="pt-2">
              <Button 
                type="submit"
                className={`w-full py-3 cursor-pointer text-lg font-medium transition-all duration-300 ${
                  isPending
                    ? "bg-indigo-400 dark:bg-indigo-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/30"
                }`}
                disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <span>Add Income</span>
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
