/** @format */
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { motion, useAnimation } from "framer-motion"
import { memo, useCallback, useEffect, useMemo, useState } from "react"

const StatCard = memo(
  ({
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
    const controls = useAnimation()

    // Animation for the progress bar
    const animateProgressBar = useCallback(() => {
      controls.start({
        width: "100%",
        transition: { duration: 1.5, ease: "easeOut" },
      })
    }, [controls])

    // Count-up animation for the value
    useEffect(() => {
      let animationFrame: number
      const duration = 1500 // ms
      const startTime = performance.now()
      const startValue = 0
      const endValue = value

      const updateValue = (currentTime: number) => {
        const elapsedTime = currentTime - startTime
        const progress = Math.min(elapsedTime / duration, 1)
        setDisplayValue(Math.floor(progress * endValue))

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateValue)
        }
      }

      animationFrame = requestAnimationFrame(updateValue)
      animateProgressBar()

      return () => {
        cancelAnimationFrame(animationFrame)
      }
    }, [value, animateProgressBar])

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
          $
          {displayValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <div className="h-1 mt-3 bg-white bg-opacity-30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={controls}
            className="h-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </motion.div>
    )
  }
)

StatCard.displayName = "StatCard"

const TransactionStats = memo(() => {
  const { totals } = useAppSelector((state) => state.transactions) ?? {
    totals: {
      income: 0,
      expense: 0,
      investment: 0,
    },
  }

  const stats = useMemo(
    () => [
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
      // {
      //   title: "Investments",
      //   value: totals?.investment ?? 0,
      //   color: "#F59E0B",
      //   gradient: "bg-gradient-to-br from-amber-500/20 to-amber-600/30",
      // },
      {
        title: "Net Balance",
        value: (totals?.income ?? 0) - (totals?.expense ?? 0),
        color: "#3B82F6",
        gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/30",
      },
    ],
    [totals?.income, totals?.expense, totals?.investment]
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={`${stat.title}-${index}`}
          title={stat.title}
          value={stat.value}
          color={stat.color}
          gradient={stat.gradient}
        />
      ))}
    </div>
  )
})

TransactionStats.displayName = "TransactionStats"
export default TransactionStats
