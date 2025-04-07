"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { selectPaginatedIncomes } from "@/lib/Redux/features/income/incomeSlices"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { useMemo } from "react"

interface IncomeRowProps {
  income: {
    id: string
    name: string
    amount: number
    type: string
    category: string
    date: string
  }
}

const IncomeRow = ({ income }: IncomeRowProps) => {
  const formattedDate = useMemo(() => 
    format(new Date(income.date), "MMM dd, yyyy"), 
    [income.date]
  )
  
  const amountColor = income.type === "CREDIT" || income.type === "INCOME" 
    ? "text-green-600" 
    : "text-red-600"
  
  const amountSign = income.type === "CREDIT" || income.type === "INCOME" 
    ? "+" 
    : "-"

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="hover:bg-gray-50"
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {income.name}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm ${amountColor}`}>
        {amountSign}${income.amount.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
        {income.type.toLowerCase()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {income.category}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formattedDate}
      </td>
    </motion.tr>
  )
}

const EmptyState = () => (
  <tr>
    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
      No income records found
    </td>
  </tr>
)

const IncomeTable = () => {
  const incomes = useAppSelector(selectPaginatedIncomes)
  const hasIncomes = incomes.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mb-6 overflow-x-auto"
    >
      <h2 className="text-xl font-semibold text-indigo-800 mb-4">
        Income Transactions
      </h2>

      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hasIncomes 
              ? incomes.map((income) => (
                  <IncomeRow key={income.id} income={income} />
                ))
              : <EmptyState />
            }
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default IncomeTable