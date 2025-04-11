/**
 * @format
 * Server component that wraps client-side sidebar and dashboard components
 * with session data from the server
 */


  
import DashboardClient, { DashboardServerWrapper } from "./DashboardClient"
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
    redirect("/login1") // Redirect to sign-in page
    // Alternatively, you could return a loading state or null
    // return null
  }


 

  return (
    <>
      <ClientSideBar session={Session} />
      <DashboardServerWrapper session={Session} />
      <DashboardClient session={Session} />
    </>
  )
}
