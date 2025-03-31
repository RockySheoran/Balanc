/** @format */

import React from "react"
import { useSelector, useDispatch } from "react-redux"


import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/Components/ui/button"
import { RootState } from "@/lib/Redux/store/store"
import { setActiveChart, setActiveIndex, setCategoryFilter, setDateRange } from "@/lib/Redux/features/expense/expenseSlice"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
]

const ExpenseAnalysis: React.FC = () => {
  const dispatch = useDispatch()
  const { activeChart, expenses } = useSelector((state: RootState) => ({
    activeChart: state.expenses.filterState.activeChart,
    expenses: state.expenses.expenses,
  }))

  // Prepare data for charts
  const categoryData = expenses.reduce((acc, expense) => {
    const existingCategory = acc.find((item) => item.name === expense.category)
    if (existingCategory) {
      existingCategory.value += expense.amount
    } else {
      acc.push({ name: expense.category, value: expense.amount })
    }
    return acc
  }, [] as { name: string; value: number }[])

  const monthlyData = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date)
    const monthYear = `${date.toLocaleString("default", {
      month: "short",
    })} ${date.getFullYear()}`
    const existingMonth = acc.find((item) => item.name === monthYear)
    if (existingMonth) {
      existingMonth.value += expense.amount
    } else {
      acc.push({ name: monthYear, value: expense.amount })
    }
    return acc
  }, [] as { name: string; value: number }[])

  const handlePieClick = (data: any, index: number) => {
    dispatch(setActiveIndex(index))
    dispatch(setCategoryFilter(data.name))
  }

  const handleBarClick = (data: any) => {
    const monthYear = data.activeLabel
    if (monthYear) {
      const [month, year] = monthYear.split(" ")
      const monthNum = new Date(`${month} 1, ${year}`).getMonth() + 1
      const start = new Date(`${year}-${monthNum}-01`)
      const end = new Date(`${year}-${monthNum + 1}-01`)
      end.setDate(end.getDate() - 1)
      dispatch(setDateRange({ from: start, to: end }))
      dispatch(setActiveIndex(null))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Expense Analysis
        </h2>
        <div className="flex space-x-2">
          <Button
            variant={activeChart === "bar" ? "default" : "outline"}
            onClick={() => dispatch(setActiveChart("bar"))}>
            Monthly View
          </Button>
          <Button
            variant={activeChart === "pie" ? "default" : "outline"}
            onClick={() => dispatch(setActiveChart("pie"))}>
            Category View
          </Button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === "bar" ? (
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
              <Legend />
              <Bar
                dataKey="value"
                name="Expense Amount"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                onClick={handlePieClick}>
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ExpenseAnalysis
