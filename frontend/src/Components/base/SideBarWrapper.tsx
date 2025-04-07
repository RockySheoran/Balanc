/**
 * @format
 * Server component that wraps client-side sidebar and dashboard components
 * with session data from the server
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"

import DashboardClient from "./DashboardClient"
import { redirect } from "next/navigation"
import { Session } from "next-auth"
import { ClientSideBar } from "./ClientSideBarProps"

/**
 * Wrapper component that provides session data to client components
 */
export default async function SideBarWrapper({Session}: {Session: Session}) {
  // Fetch session data
  

  // Handle unauthenticated users
  if (!Session) {
    redirect("/login") // Redirect to sign-in page
    // Alternatively, you could return a loading state or null
    // return null
  }

  // Validate session structure (optional)
  if (!Session.user?.email) {
    // console.error("Invalid session structure:", session)
    redirect("/login")
  }

  return (
    <>
      <ClientSideBar session={Session} />
      <DashboardClient session={Session} />
    </>
  )
}
