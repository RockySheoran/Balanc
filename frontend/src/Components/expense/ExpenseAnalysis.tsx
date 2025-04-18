/** @format */
import React, { useMemo, useCallback, useState, useEffect } from "react"
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-8 transition-all">
      <div className="flex flex-col gap-3 md:flex-row justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
          Expense Analysis
        </h2>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={activeChart === "bar" ? "default" : "outline"}
            onClick={handleChartToggle("bar")}>
            Monthly View
          </Button>
          <Button
            size="sm"
            variant={activeChart === "pie" ? "default" : "outline"}
            onClick={handleChartToggle("pie")}>
            Category View
          </Button>
        </div>
      </div>

      <div className="h-[300px] sm:h-[350px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === "bar" ? (
            <BarChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 60,
              }}
              onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                }}
              />
              <Bar dataKey="value" name="Expense Amount" radius={[4, 4, 0, 0]}>
                {monthlyData?.map((entry, index) => (
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
                cy={isMobile ? "45%" : "50%"}
                labelLine={false}
                outerRadius={isMobile ? 70 : 80}
                innerRadius={isMobile ? 40 : 50}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                  index,
                }) => {
                  const RADIAN = Math.PI / 180
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                  const y = cy + radius * Math.sin(-midAngle * RADIAN)

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight="bold">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  )
                }}
                onClick={handlePieClick}>
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend
                layout={isMobile ? "horizontal" : "vertical"}
                verticalAlign={isMobile ? "bottom" : "middle"}
                align="right"
                wrapperStyle={{
                  paddingTop: isMobile ? "10px" : "0",
                  paddingLeft: isMobile ? "0" : "10px",
                  fontSize: "12px",
                }}
                formatter={(value) => (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default React.memo(ExpenseAnalysis)
