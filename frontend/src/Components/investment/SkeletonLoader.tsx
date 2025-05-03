/** @format */

// components/SkeletonLoader.tsx
import React from "react"

interface SkeletonLoaderProps {
  className?: string
  count?: number
  circle?: boolean
  height?: number | string
  width?: number | string
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = "",
  count = 1,
  circle = false,
  height = "100%",
  width = "100%",
}) => {
  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className} ${
        circle ? "rounded-full" : "rounded-md"
      }`}
      style={{ height, width }}
    />
  ))

  return <>{elements}</>
}

export default SkeletonLoader
