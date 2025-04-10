/** @format */

"use client"
import React, { useState } from "react"

import { Session } from "next-auth"
import SideBar from "../base/SideBar"



interface ClientSideBarProps {
  session: Session & { token?: string }
}

export function ClientSideBar({ session }: ClientSideBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={""}>
    <SideBar
      session={session}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    />
    </div>
  )
}
