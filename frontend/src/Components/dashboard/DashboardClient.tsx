/** @format */

// src/app/dashboard/DashboardClient.tsx (Client Component)
"use client"

import { useEffect } from "react"

import { signOut } from "next-auth/react"
import { useAppDispatch } from "@/lib/Redux/store/hooks"
import { setUser } from "@/lib/Redux/features/user/userSlice"


interface SessionProps {
  session: {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  } | null
}

export default function DashboardClient({ session }: SessionProps) {
  const dispatch = useAppDispatch()
  // console.log(session.token)
  useEffect(() => {
    if (!session) {
      signOut({ redirect: true, callbackUrl: "/login" })
    } else {
      const data = {
        id: null, // Add a default value for id
        name: session.user?.name || "",
        email: session.user?.email || "",
        image: session.user?.image || "",
        token: session?.token || "",
      }
       console.log(data)
      dispatch(setUser(data))
    }
  }, [session, dispatch])
  return <></>
}
