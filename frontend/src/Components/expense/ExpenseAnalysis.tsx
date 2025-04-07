/** @format */
import React, { useMemo, useCallback } from "react"
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
import {
  setActiveChart,
  setActiveIndex,
  setCategoryFilter,
  setDateRange,
} from "@/lib/Redux/features/expense/expenseSlice"

// Constants
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
] as const

interface ChartData {
  name: string
  value: number
}

const ExpenseAnalysis: React.FC = () => {
  const dispatch = useDispatch()
  const { activeChart, expenses } = useSelector((state: RootState) => ({
    activeChart: state.expenses.filterState.activeChart,
    expenses: state.expenses.expenses,
  }))

  // Memoized chart data calculations
  const categoryData = useMemo(() => {
    return expenses.reduce((acc: ChartData[], expense) => {
      const existingCategory = acc.find(
        (item) => item.name === expense.category
      )
      if (existingCategory) {
        existingCategory.value += expense.amount
      } else {
        acc.push({ name: expense.category, value: expense.amount })
      }
      return acc
    }, [])
  }, [expenses])

  const monthlyData = useMemo(() => {
    return expenses.reduce((acc: ChartData[], expense) => {
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
    }, [])
  }, [expenses])

  // Memoized event handlers
  const handlePieClick = useCallback(
    (data: ChartData, index: number) => {
      dispatch(setActiveIndex(index))
      dispatch(setCategoryFilter(data.name))
    },
    [dispatch]
  )

  const handleBarClick = useCallback(
    (data: { activeLabel?: string }) => {
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
    },
    [dispatch]
  )

  const handleChartToggle = useCallback(
    (chartType: "bar" | "pie") => () => {
      dispatch(setActiveChart(chartType))
    },
    [dispatch]
  )

  // Custom tooltip formatter
  const formatTooltip = useCallback(
    (value: number) => [`$${value.toFixed(2)}`, "Amount"],
    []
  )

  // Custom pie chart label formatter
  const renderPieLabel = useCallback(
    ({ name, percent }: { name: string; percent: number }) =>
      `${name} ${(percent * 100).toFixed(0)}%`,
    []
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Expense Analysis
        </h2>
        <div className="flex space-x-2">
          <Button
            variant={activeChart === "bar" ? "default" : "outline"}
            onClick={handleChartToggle("bar")}>
            Monthly View
          </Button>
          <Button
            variant={activeChart === "pie" ? "default" : "outline"}
            onClick={handleChartToggle("pie")}>
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
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar dataKey="value" name="Expense Amount" radius={[4, 4, 0, 0]}>
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
                dataKey="value"
                nameKey="name"
                label={renderPieLabel}
                onClick={handlePieClick}>
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltip} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default React.memo(ExpenseAnalysis)
