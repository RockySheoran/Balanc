/** @format */

// app/providers/ReduxProvider.tsx
"use client"

import { useRef } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { makeStore, AppStore } from "@/lib/store"
import { persistStore } from "redux-persist"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null)
  const persistorRef = useRef<ReturnType<typeof persistStore> | null>(null)

  if (typeof window !== "undefined" && !storeRef.current) {
    // Create the store instance only once on the client side
    storeRef.current = makeStore()
    persistorRef.current = persistStore(storeRef.current)
  }

  if (!storeRef.current) {
    // Server side - return children without Provider
    return <>{children}</>
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current}>
        {children}
      </PersistGate>
    </Provider>
  )
}
