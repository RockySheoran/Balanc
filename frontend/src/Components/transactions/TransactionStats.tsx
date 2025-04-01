/** @format */
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const StatCard = ({
  title,
  value,
  color,
  gradient,
}: {
  title: string
  value: number
  color: string
  gradient: string
}) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1.5
    const start = 0
    const end = value
    let startTimestamp: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min(
        (timestamp - startTimestamp) / (duration * 1000),
        1
      )
      setDisplayValue(Math.floor(progress * end))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-xl shadow-lg ${gradient} backdrop-blur-sm bg-opacity-20 border border-white border-opacity-20`}>
      <h3 className="text-sm font-medium text-white text-opacity-80 mb-2">
        {title}
      </h3>
      <p
        className="text-3xl font-bold text-white"
        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
        ${displayValue.toFixed(2)}
      </p>
      <div className="h-1 mt-3 bg-white bg-opacity-30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-white"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  )
}

export default function TransactionStats() {
  const { totals } = useAppSelector((state) => state.transactions) ?? {
    totals: {
      income: 0,
      expense: 0,
      investment: 0,
    },
  }

  const stats = [
    {
      title: "Total Income",
      value: totals?.income ?? 0,
      color: "#10B981",
      gradient: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/30",
    },
    {
      title: "Total Expenses",
      value: totals?.expense ?? 0,
      color: "#EF4444",
      gradient: "bg-gradient-to-br from-red-500/20 to-red-600/30",
    },
    {
      title: "Investments",
      value: totals?.investment ?? 0,
      color: "#F59E0B",
      gradient: "bg-gradient-to-br from-amber-500/20 to-amber-600/30",
    },
    {
      title: "Net Balance",
      value: (totals?.income ?? 0) - (totals?.expense ?? 0),
      color: "#3B82F6",
      gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/30",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          color={stat.color}
          gradient={stat.gradient}
        />
      ))}
    </div>
  )
}
