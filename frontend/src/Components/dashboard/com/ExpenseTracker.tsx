/** @format */

"use client"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import { motion } from "framer-motion"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export const ExpenseTracker = () => {
  const transactions = [
    { category: "Shopping", amount: 430, date: "17th Feb 2025" },
    { category: "Travel", amount: 670, date: "13th Feb 2025" },
    { category: "Electricity Bill", amount: 200, date: "11th Feb 2025" },
    { category: "Loan Repayment", amount: 600, date: "10th Feb 2025" },
  ]

  // Chart data
  const chartData = {
    labels: transactions.map((t) => t.category),
    datasets: [
      {
        label: "Expense Amount",
        data: transactions.map((t) => t.amount),
        backgroundColor: [
          "#FF6384", // Red
          "#36A2EB", // Blue
          "#FFCE56", // Yellow
          "#4BC0C0", // Teal
        ],
        drawBorder: false,
        borderRadius: 6, // Pillar effect
        borderSkipped: false,
      },
    ],
  }

  return (
    <div className="w-full mt-3 mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Transactions */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Expenses</h1>
          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center border-b pb-4 last:border-0">
                <div>
                  <p className="font-semibold text-gray-800">
                    {transaction.category}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {transaction.date}
                  </p>
                </div>
                <p className="text-red-500 font-bold">-${transaction.amount}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column - Pillar Chart */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Last 30 Days Expenses
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-64" // Fixed height for consistency
          >
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      borderWidth: 0,
                    },
                    ticks: {
                      callback: (value) => "$" + value,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        return `Amount: $${context.raw}`
                      },
                    },
                  },
                },
                animation: {
                  duration: 1000,
                },
              }}
            />
          </motion.div>

          {/* Color Legend */}
          <div className="mt-6 flex flex-wrap gap-3">
            {transactions.map((transaction, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      chartData.datasets[0].backgroundColor[index],
                  }}></div>
                <span className="text-sm text-gray-600">
                  {transaction.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
