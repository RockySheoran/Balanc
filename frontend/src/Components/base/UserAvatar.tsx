/** @format */
"use client"

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
    <Avatar className="relative h-10 w-10">
      {user?.image ? (
        // Using regular img tag instead of Next.js Image
        <img
          src={user.image}
          alt={user.name || "User"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer" // Important for Google images
        />
      ) : (
        <AvatarFallback className="h-full w-full">
          {user?.name
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
