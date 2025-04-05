/** @format */
"use client"
import React from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Investment } from "./investment"


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface PerformanceChartProps {
  investments: Investment[]
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ investments }) => {
  // In a real app, you would fetch historical data for each investment
  // For this example, we'll simulate some data
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]

  const generateRandomData = (baseValue: number) => {
    return labels.map((_, i) => {
      const fluctuation = (Math.random() - 0.5) * baseValue * 0.2
      return baseValue + fluctuation
    })
  }

  const data = {
    labels,
    datasets: investments?.map((inv) => ({
      label: `${inv.symbol} - ${inv.name}`,
      data: generateRandomData(inv.buyPrice),
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      tension: 0.1,
    })),
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Investment Performance",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

  return (
    <div className="h-80">
      <Line options={options} data={data} />
    </div>
  )
}

export default PerformanceChart
