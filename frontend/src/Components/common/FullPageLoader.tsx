/** @format */

import LoadingSpinner from "../expense/LoadingSpinner";

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner className="h-32" />
    </div>
  )
}
