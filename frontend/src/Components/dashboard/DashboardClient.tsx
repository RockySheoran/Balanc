/** @format */

// src/app/dashboard/DashboardClient.tsx (Client Component)
"use client"

import { useEffect } from "react"

import { signOut } from "next-auth/react"

import { setUser } from "@/lib/Redux/features/user/userInfoSlice"
import { useAppDispatch } from "@/lib/Redux/hooks"

interface SessionProps {
  session: {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  } | null
}

export default function DashboardClient({
   session }: SessionProps) {
  const dispatch = useAppDispatch()
  // console.log(session.token)
  useEffect(() => {
    if (!session) {
      signOut({ redirect: true, callbackUrl: "/login" })
    } else {
      const data = {
        name: session.user?.name || "",
        email: session.user?.email || "",
        image: session.user?.image || "",
      }
     console.log(data)
      dispatch(setUser(data))
    }
  }, [session, dispatch])
  return (
    <></>
  )

 
}
