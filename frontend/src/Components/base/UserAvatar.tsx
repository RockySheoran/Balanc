/** @format */

"use client" // Mark this component as a client component

import React from "react"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"

interface UserAvatarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function UserAvatar({ user }: UserAvatarProps) {
  return (
    <Avatar>
      {user.image ? (
        <img src={user.image} alt={user.name || "User"} />
      ) : (
        <AvatarFallback>
          {user.name
            ? user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
            : "U"}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
