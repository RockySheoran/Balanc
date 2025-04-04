/** @format */

"use client"

import { motion } from "framer-motion"
import { format } from "date-fns"
import { selectPaginatedIncomes } from "@/lib/Redux/features/income/incomeSlices"
import { useAppSelector } from "@/lib/Redux/store/hooks"

const IncomeTable = () => {
  const incomes = useAppSelector(selectPaginatedIncomes)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mb-6 overflow-x-auto">
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
            {incomes.map((income) => (
              <motion.tr
                key={income.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {income.name}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    income.type === "CREDIT" || "INCOME"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {income.type === "CREDIT" || "INCOME" ? "+" : "-"}$
                  {income.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {income.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {income.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(income.date), "MMM dd, yyyy")}
                </td>
              </motion.tr>
            ))}
            {incomes.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500">
                  No income records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default IncomeTable
