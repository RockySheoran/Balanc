/** @format */
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Sector,
  AreaChart,
  Area,
} from "recharts"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card"
import { useState, useMemo, useCallback, memo } from "react"
import { FiTrendingUp, FiTrendingDown, FiPieChart } from "react-icons/fi"
import { motion } from "framer-motion"

// Constants
const COLORS = [
  "#10B981", // Emerald
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#6B7280", // Gray
]

const TRANSACTION_TYPES = {
  INCOME: ["INCOME", "CREDIT"],
  EXPENSE: ["EXPENSES", "DEBIT", "TRANSFER", "CASH"],
  INVESTMENT: ["INVESTMENT"],
}

// Memoized components
const ActivePieShape = memo((props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props

  return (
    <g>
      <text
        x={cx}
        y={cy - 10}
        dy={8}
        textAnchor="middle"
        fill={fill}
        className="font-bold text-lg">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748B">
        {`${(percent * 100).toFixed(0)}% ($${value.toLocaleString()})`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
})
ActivePieShape.displayName = "ActivePieShape"

const TransactionCharts = memo(() => {
  const { transactions } = useAppSelector((state) => state.transactions)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  // Process transactions data
  const { totals, counts, monthlyData, categoryData, cashFlowData } =
    useMemo(() => {
      const now = new Date()
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(now.getMonth() - 5)

      // Initialize data structures
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now)
        date.setMonth(now.getMonth() - (5 - i))
        return {
          month: date.toLocaleString("default", { month: "short" }),
          income: 0,
          expenses: 0,
        }
      })

      const calculatedTotals = { income: 0, expense: 0, investment: 0 }
      const calculatedCounts = { income: 0, expense: 0, investment: 0 }
      const categoryMap: Record<string, number> = {}

      // Process transactions in a single pass
      transactions?.forEach((transaction) => {
        const amount = Math.abs(transaction.amount)
        const date = new Date(transaction.date)
        const monthIndex = months.findIndex(
          (m) => m.month === date.toLocaleString("default", { month: "short" })
        )

        if (TRANSACTION_TYPES.INCOME.includes(transaction.type)) {
          calculatedTotals.income += amount
          calculatedCounts.income++
          if (monthIndex >= 0) months[monthIndex].income += amount
        } else if (TRANSACTION_TYPES.EXPENSE.includes(transaction.type)) {
          calculatedTotals.expense += amount
          calculatedCounts.expense++
          if (monthIndex >= 0) months[monthIndex].expenses += amount
          categoryMap[transaction.category] =
            (categoryMap[transaction.category] || 0) + amount
        } else if (TRANSACTION_TYPES.INVESTMENT.includes(transaction.type)) {
          calculatedTotals.investment += amount
          calculatedCounts.investment++
        }
      })

      // Prepare final data
      return {
        totals: calculatedTotals,
        counts: calculatedCounts,
        monthlyData: months,
        categoryData: Object.entries(categoryMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6),
        cashFlowData: months.map((month) => ({
          ...month,
          net: month.income - month.expenses,
        })),
      }
    }, [transactions])

  // Memoized pie chart data
  const pieData = useMemo(
    () =>
      [
        { name: "Income", value: totals.income, count: counts.income },
        { name: "Expenses", value: totals.expense, count: counts.expense },
        {
          name: "Investments",
          value: totals.investment,
          count: counts.investment,
        },
      ].filter((item) => item.value > 0),
    [totals, counts]
  )

  // Event handlers
  const onPieEnter = useCallback(
    (_: any, index: number) => setActiveIndex(index),
    []
  )
  const handleBarHover = useCallback(
    (data: any) => setHoveredBar(data?.activeLabel || null),
    []
  )
  const handleBarLeave = useCallback(() => setHoveredBar(null), [])

  // Tooltip formatters
  const currencyFormatter = useCallback(
    (value: number) => `$${value.toLocaleString()}`,
    []
  )
  const pieTooltipFormatter = useCallback(
    (value: number, name: string) => [
      currencyFormatter(value),
      `${name} (${
        pieData.find((d) => d.name === name)?.count || 0
      } transactions)`,
    ],
    [pieData, currencyFormatter]
  )

  // Gradient definitions
  const renderGradients = useCallback(
    () => (
      <defs>
        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
        </linearGradient>
      </defs>
    ),
    []
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Cash Flow Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <div className="flex flex-col md:flex-row space-y-1 justify-between ">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FiTrendingUp className="text-emerald-500" />
                Monthly Cash Flow
              </CardTitle>
              <div className="flex gap-2 content-center text-center">
                <span className="text-sm px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  Income: {currencyFormatter(totals.income)}
                </span>
                <span className="text-sm px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  Expenses: {currencyFormatter(totals.expense)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  {renderGradients()}
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={currencyFormatter} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    fill="url(#colorIncome)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    fill="url(#colorExpenses)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#3B82F6"
                    fill="url(#colorNet)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Distribution Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FiPieChart className="text-violet-500" />
                Transaction Distribution
              </CardTitle>
              <div className="text-sm text-gray-500">
                {transactions.length} transactions
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={ActivePieShape}
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    dataKey="value"
                    onMouseEnter={onPieEnter}>
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={pieTooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense Categories Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-2">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FiTrendingDown className="text-red-500" />
                Expense Categories
              </CardTitle>
              <div className="text-sm text-gray-500">
                {counts.expense} expense transactions
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  onMouseEnter={handleBarHover}
                  onMouseLeave={handleBarLeave}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={currencyFormatter} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          hoveredBar === entry.name
                            ? COLORS[index % COLORS.length]
                            : `${COLORS[index % COLORS.length]}80`
                        }
                        strokeWidth={hoveredBar === entry.name ? 2 : 0}
                        stroke="#fff"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {categoryData.map((entry, index) => (
                <motion.div
                  key={entry.name}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center px-3 py-1 rounded-full shadow-sm"
                  style={{
                    backgroundColor: `${COLORS[index % COLORS.length]}20`,
                    border: `1px solid ${COLORS[index % COLORS.length]}`,
                  }}>
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {entry.name}: {currencyFormatter(entry.value)}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
})

TransactionCharts.displayName = "TransactionCharts"
export default TransactionCharts
  