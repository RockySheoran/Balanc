/** @format */

// app/components/SideBarWrapper.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { ClientSideBar } from "./ClientSideBarProps"
import DashboardClient from "../dashboard/DashboardClient";

export default async function SideBarWrapper() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null; // or handle the null case appropriately
  }

  return (
    <>
      <ClientSideBar session={session} />
      <DashboardClient session={session} />
    </>
  )
}
