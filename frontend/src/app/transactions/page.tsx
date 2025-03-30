/** @format */
"use client"
import { useState } from "react"
import { Button } from "@/Components/ui/button"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { DownloadIcon, ChevronDownIcon, ArrowUpDownIcon } from "./Icons"

const COLORS = {
  CREDIT: "#10B981", // emerald
  DEBIT: "#3B82F6", // blue
  TRANSFER: "#8B5CF6", // violet
  EXPENSE: "#EF4444", // red
  OTHER: "#6B7280", // gray
}

const transactionTypes = [
  { value: "all", label: "All Transactions" },
  { value: "credit", label: "Credits" },
  { value: "debit", label: "Debits" },
  { value: "transfer", label: "Transfers" },
  { value: "expense", label: "Expenses" },
]

const timeFilters = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
]

const transactionsData = [
  {
    id: 1,
    date: "2023-05-15",
    description: "Salary Deposit",
    amount: 2500.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 2,
    date: "2023-05-14",
    description: "Grocery Store",
    amount: -85.32,
    type: "EXPENSE",
    category: "Food",
  },
  {
    id: 3,
    date: "2023-05-13",
    description: "Transfer to Savings",
    amount: -500.0,
    type: "TRANSFER",
    category: "Savings",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  {
    id: 4,
    date: "2023-05-12",
    description: "Electric Bill",
    amount: -120.5,
    type: "DEBIT",
    category: "Utilities",
  },
  {
    id: 5,
    date: "2023-05-10",
    description: "Freelance Payment",
    amount: 750.0,
    type: "CREDIT",
    category: "Income",
  },
  // Add more transactions as needed
]

const chartData = [
  { name: "Credits", value: 3250 },
  { name: "Debits", value: 205.5 },
  { name: "Transfers", value: 500 },
  { name: "Expenses", value: 205.82 },
]

const lineData = [
  { name: "Jan", credits: 2000, debits: 1000 },
  { name: "Feb", credits: 3000, debits: 1500 },
  { name: "Mar", credits: 2000, debits: 800 },
  { name: "Apr", credits: 2780, debits: 1200 },
  { name: "May", credits: 1890, debits: 900 },
  { name: "Jun", credits: 2390, debits: 1100 },
]

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(5)
  const [timeFilter, setTimeFilter] = useState("month")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof typeof transactionsData[0]
    direction: "asc" | "desc"
  }>({
    key: "date",
    direction: "desc",
  })

  // Filter transactions
  const filteredTransactions = transactionsData
    .filter((t) => typeFilter === "all" || t.type.toLowerCase() === typeFilter)
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  )
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  )

interface SortConfig {
    key: keyof typeof transactionsData[0];
    direction: "asc" | "desc";
}

const requestSort = (key: keyof typeof transactionsData[0]): void => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
    }
    setSortConfig({ key, direction });
};

const getTypeColor = (type: keyof typeof COLORS): string => {
    return COLORS[type] || COLORS.OTHER
}

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your financial transactions
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Stats Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">
            Total Credits
          </h3>
          <p className="text-2xl font-bold text-emerald-500">$3,250.00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">
            Total Debits
          </h3>
          <p className="text-2xl font-bold text-blue-500">$205.50</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">
            Transfers
          </h3>
          <p className="text-2xl font-bold text-violet-500">$500.00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm">Expenses</h3>
          <p className="text-2xl font-bold text-red-500">$205.82</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <Line
                  type="monotone"
                  dataKey="credits"
                  stroke="#10B981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="debits"
                  stroke="#EF4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">
            Transaction Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        Object.values(COLORS)[
                          index % Object.values(COLORS).length
                        ]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-700">
            {timeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-700">
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          className="border-gray-300 dark:border-gray-600">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("date")}>
                  <div className="flex items-center">
                    Date
                    <ArrowUpDownIcon className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("amount")}>
                  <div className="flex items-center">
                    Amount
                    <ArrowUpDownIcon className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort("type")}>
                  <div className="flex items-center">
                    Type
                    <ArrowUpDownIcon className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.description}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.amount > 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}>
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(
                        transaction.type as keyof typeof COLORS
                      )}`}
                      style={{
                        backgroundColor: `${getTypeColor(transaction.type as keyof typeof COLORS)}20`,
                      }}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">
                  {indexOfFirstTransaction + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    indexOfLastTransaction,
                    filteredTransactions.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredTransactions.length}
                </span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <span className="sr-only">Previous</span>
                  <ChevronDownIcon className="h-5 w-5 transform rotate-90" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === number
                          ? "z-10 bg-primary border-primary text-white"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}>
                      {number}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <span className="sr-only">Next</span>
                  <ChevronDownIcon className="h-5 w-5 transform -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
