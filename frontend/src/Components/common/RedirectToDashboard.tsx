/** @format */

// components/RedirectToDashboard.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function RedirectToDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (session && pathname === "/") {
      router.replace("/dashboard")
    }
  }, [session, pathname, router])

  return null
}
