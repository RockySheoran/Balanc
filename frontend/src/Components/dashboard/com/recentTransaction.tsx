"use client";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend);

export const RecentTransaction = () => {
  const transactions = [
    {
      type: "expense",
      category: "Shopping",
      amount: 430,
      date: "17th Feb 2025",
    },
    { type: "expense", category: "Travel", amount: 670, date: "13th Feb 2025" },
    {
      type: "income",
      category: "Salary",
      amount: 12000,
      date: "12th Feb 2025",
    },
    {
      type: "expense",
      category: "Electricity Bill",
      amount: 200,
      date: "11th Feb 2025",
    },
    {
      type: "expense",
      category: "Loan Repayment",
      amount: 600,
      date: "10th Feb 2025",
    },
  ]

  const chartData = {
    labels: ["Salary", "Shopping", "Travel", "Bills", "Loan"],
    datasets: [
      {
        data: [12000, 430, 670, 200, 600],
        backgroundColor: [
          "#4ade80", // green
          "#f87171", // red
          "#fbbf24", // yellow
          "#60a5fa", // blue
          "#a78bfa", // purple
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="w-full mt-5 mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Financial Summary */}

        <div className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Recent Transactions
            </h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              See All →
            </button>
          </div>

          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      transaction.type === "income"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}></div>
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <p
                  className={`font-medium ${
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {transaction.type === "income" ? "+" : "-"}$
                  {transaction.amount}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Right Column - Transactions */}
        <div className="md:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Financial Overview
            </h3>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total Balance</span>
              <span className="text-xl font-bold">$9,100</span>
            </div>

            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Income</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span>Expenses</span>
              </div>
            </div>
          </motion.div>

          {/* Doughnut Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 rounded-lg flex justify-around p-4 h-80">
            <Doughnut
              data={chartData}
              options={{
                cutout: "70%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 10,
                      padding: 20,
                    },
                  },
                },
                animation: {
                  animateScale: true,
                  animateRotate: true,
                },
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}