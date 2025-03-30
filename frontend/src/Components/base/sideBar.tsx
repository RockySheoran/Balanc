/** @format */

// app/components/ClientSideBar.tsx
"use client"
import React, { useState } from "react"
import { SideBar } from "../dashboard/com/SideBar"
import { Session } from "next-auth"

interface ClientSideBarProps {
  session: Session & { token?: string }
}

export function ClientSideBar({ session }: ClientSideBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={isCollapsed ? "w-20":"w-64"}>
    <SideBar
      session={session}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    />
    </div>
  )
}
