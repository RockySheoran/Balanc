// /** @format */

// "use client"
// import { useRef } from "react"

// import { Provider } from "react-redux"
// import { PersistGate } from "redux-persist/integration/react"

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { persistor, store } from "@/lib/Redux/store/store"

// export default function StoreProvider({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const queryClientRef = useRef(
//     new QueryClient({
//       defaultOptions: {
//         queries: {
//           staleTime: 60 * 1000, // 1 minute cache
//           refetchOnWindowFocus: false,
//         },
//       },
//     })
//   )

//   return (
//     <Provider store={store}>
//       <PersistGate loading={null} persistor={persistor}>
//         <QueryClientProvider client={queryClientRef.current}>
//           {children}
//         </QueryClientProvider>
//       </PersistGate>
//     </Provider>
//   )
// }
