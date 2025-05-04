
  // AccountSelectorSkeleton.tsx
  export const AccountSelectorSkeleton = () => (
    <div className="w-full p-4 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>
      
      {/* Selector */}
      <div className="space-y-2">
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="relative">
          <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Account Details */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );