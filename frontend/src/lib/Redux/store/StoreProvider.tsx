/** @format */
"use client"
import { useRef } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { store, persistor } from "./store"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

interface StoreProviderProps {
  children: React.ReactNode
}

export const StoreProvider = ({
  children,
}: StoreProviderProps): React.ReactElement => {
  // Initialize query client only once
  const queryClient = useRef<QueryClient>(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute cache
          refetchOnWindowFocus: false,
        },
      },
    })
  ).current

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  )
}
