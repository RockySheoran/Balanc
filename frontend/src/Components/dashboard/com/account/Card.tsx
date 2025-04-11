/** @format */

// Card.tsx
"use client"

import { Skeleton } from "@/Components/ui/skeleton"
import { Icons } from "./icons1"



export const Card = ({
  title,
  value,
  trend,
  icon,
  gradient,
  iconBg,
  iconColor,
  trendColor,
}: {
  title: string
  value?: number
  trend: string
  icon: keyof typeof Icons
  gradient: string
  iconBg: string
  iconColor: string
  trendColor: string
}) => {
  const IconComponent = Icons[icon] ?? Icons.default

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 w-full">
      <div className={`p-6 bg-gradient-to-r ${gradient}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {title}
          </h1>
          <div className={`p-2 rounded-full ${iconBg} ${iconColor}`}>
            <IconComponent className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-gray-900">
          ${value?.toLocaleString()}
        </h2>
        <p className={`mt-2 text-sm ${trendColor} flex items-center`}>
          <Icons.trendUp className="h-4 w-4 mr-1" />
          {trend}
        </p>
      </div>
    </div>
  )
}

export const CardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full">
    <div className="p-6 bg-gray-50">
      <div className="flex justify-between">
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-9 w-40 mt-3 rounded-md" />
      <Skeleton className="h-5 w-24 mt-2 rounded-md" />
    </div>
  </div>
)
