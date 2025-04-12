/** @format */

"use client"
import { persistor, store } from "@/lib/Redux/store/store"
import { useRef } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"


export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef(store)
  const persistorRef = useRef(persistor)

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current}>
        {children}
      </PersistGate>
    </Provider>
  )
}
