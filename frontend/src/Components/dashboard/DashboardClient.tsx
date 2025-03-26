/** @format */

// src/app/dashboard/DashboardClient.tsx (Client Component)
"use client"

import { useEffect } from "react"

import { signOut } from "next-auth/react"
import { useAppDispatch } from "@/lib/Redux/hooks"
import { setUser } from "@/lib/Redux/features/user/userInfoSlice"

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

  useEffect(() => {
    if (!session) {
      signOut({ redirect: true, callbackUrl: "/login" })
    } else {
      const data = {
        name: session.user?.name || "",
        email: session.user?.email || "",
        image: session.user?.image || "",
      }
      dispatch(setUser(data))
    }
  }, [session, dispatch])
  return (
    <></>
  )

 
}
