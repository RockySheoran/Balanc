/** @format */

import { Skeleton } from "../ui/skeleton";

// components/common/LoadingCard.tsx


export const LoadingCard = ({ height = "h-32" }: { height?: string }) => (
  <div className={`w-full ${height} bg-white rounded-xl shadow`}>
    <Skeleton className="h-full w-full rounded-xl" />
  </div>
)
