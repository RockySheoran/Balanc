/** @format */

export default function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
      ))}
    </div>
  )
}
