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
} from "recharts"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card"
import { useState } from "react"

const COLORS = [
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#3B82F6",
  "#F59E0B",
  "#6B7280",
]

const renderActiveShape = (props: any) => {
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
        className="font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#999">
        {`${(percent * 100).toFixed(0)}% ($${value.toFixed(2)})`}
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
}

export default function TransactionCharts() {
  const {
    totals,
    incomeTransactions = [],
    expenseTransactions = [],
    counts,
  } = useAppSelector((state) => state.transactions) ?? {
    totals: { income: 0, expense: 0, investment: 0 },
    incomeTransactions: [],
    expenseTransactions: [],
    counts: { income: 0, expense: 0, investment: 0 },
  }

  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  // Pie Chart Data
  const pieData = [
    { name: "Income", value: totals?.income ?? 0, count: counts?.income ?? 0 },
    {
      name: "Expenses",
      value: totals?.expense ?? 0,
      count: counts?.expense ?? 0,
    },
    {
      name: "Investments",
      value: totals?.investment ?? 0,
      count: counts?.investment ?? 0,
    },
  ]

  // Monthly trend data (would ideally come from your backend)
  const monthlyData = [
    { month: "Jan", income: 4000, expenses: 2400 },
    { month: "Feb", income: 3000, expenses: 1398 },
    { month: "Mar", income: 9800, expenses: 2000 },
    { month: "Apr", income: 3908, expenses: 2780 },
    { month: "May", income: 4800, expenses: 1890 },
    { month: "Jun", income: 3800, expenses: 2390 },
  ]

  // Category breakdown
  const categoryData = [
    {
      name: "Food",
      value: expenseTransactions
        .filter((t) => t.category === "Food")
        .reduce((sum, t) => sum + t.amount, 0),
    },
    {
      name: "Transport",
      value: expenseTransactions
        .filter((t) => t.category === "Transport")
        .reduce((sum, t) => sum + t.amount, 0),
    },
    {
      name: "Entertainment",
      value: expenseTransactions
        .filter((t) => t.category === "Entertainment")
        .reduce((sum, t) => sum + t.amount, 0),
    },
    {
      name: "Utilities",
      value: expenseTransactions
        .filter((t) => t.category === "Utilities")
        .reduce((sum, t) => sum + t.amount, 0),
    },
  ].filter((item) => item.value > 0)

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trend Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Monthly Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "0.5rem",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Distribution Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Transaction Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}>
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(2)}`,
                    `${name} (${
                      pieData.find((d) => d.name === name)?.count
                    } transactions)`,
                  ]}
                  contentStyle={{
                    background: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "0.5rem",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onMouseEnter={(data) =>
                  setHoveredBar(data?.activeLabel || null)
                }
                onMouseLeave={() => setHoveredBar(null)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "0.5rem",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  name="Amount"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}>
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={hoveredBar === entry.name ? "#F87171" : "#EF4444"}
                      strokeWidth={hoveredBar === entry.name ? 2 : 0}
                      stroke="#fff"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
