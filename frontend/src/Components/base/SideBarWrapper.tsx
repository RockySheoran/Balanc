/**
 * @format
 * Server component that wraps client-side sidebar and dashboard components
 * with session data from the server
 */

"use client"
  
import DashboardClient, { DashboardServerWrapper } from "./DashboardClient"
import { redirect } from "next/navigation"
import { Session } from "next-auth"
import { ClientSideBar } from "./ClientSideBarProps"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Wrapper component that provides session data to client components
 */
export default  function SideBarWrapper({Session}: {Session: Session}) {
  // Fetch session data

  // Handle unauthenticated users
  const router = useRouter()

  // useEffect(() => {
  //   if (!Session) {
  //     router.replace("/login")
  //   }
  // }, [Session, router])
  // if (!Session) return null // Optionally render nothing or a loader

  return (
    <>
      <ClientSideBar session={Session} />
      <DashboardServerWrapper session={Session} />
      {/* <DashboardClient session={Session} /> */}
    </>
  )
}
