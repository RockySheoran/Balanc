/** @format */

import React from "react"

interface Props {
  error: Error
}

const ErrorFallback: React.FC<Props> = ({ error }) => (
  <div className="p-4 text-red-500">
    <h2 className="text-lg font-bold">Something went wrong</h2>
    <pre className="mt-2 text-sm">{error.message}</pre>
    <button
      className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      onClick={() => window.location.reload()}>
      Reload Page
    </button>
  </div>
)

export default ErrorFallback
