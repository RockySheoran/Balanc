import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale,
  } from 'chart.js'
  
  export const ChartJSRegister = () => {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler,
      TimeScale
    )
  }
  
  export const COLOR_PALETTE = [
    "#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9",
    "#c45850", "#4dc9f6", "#f67019", "#f53794",
    "#537bc4", "#acc236", "#166a8f", "#00a950",
    "#58595b", "#8549ba"
  ]
  
  export const getChartOptions = (range: string, currency: string = 'USD') => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          padding: 20,
          usePointStyle: true,
          font: { size: 12 }
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ""
            const value = context.parsed.y
            return value !== null 
              ? `${label}: ${new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(value)}`
              : label
          },
          afterLabel: (context: any) => {
            const investment = context.dataset.investment
            if (!investment) return ''
            
            const currentValue = context.parsed.y
            const buyPrice = investment.buyPrice
            const profit = currentValue - buyPrice
            const profitPercentage = (profit / buyPrice) * 100
            
            return [
              `Cost: ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
              }).format(buyPrice)}`,
              `Return: ${profit >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`
            ]
          }
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: range === '1d' ? 8 : 10,
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(value)
        },
      },
    },
  })