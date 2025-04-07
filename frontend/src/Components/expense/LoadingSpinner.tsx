/** @format */

// components/ui/LoadingSpinner.tsx
import { memo } from "react"

const LoadingSpinner = memo(({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
  </div>
))

LoadingSpinner.displayName = "LoadingSpinner"
export default LoadingSpinner
