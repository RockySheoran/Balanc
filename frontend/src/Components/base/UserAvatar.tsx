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
  // console.log(user)
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
        <AvatarFallback className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-700">
          {user?.name
            ? user.name
                .split(" ")
                .filter((part) => part.length > 0) // Filter out empty strings
                .slice(0, 2) // Take first two parts only
                .map((part) => part[0].toUpperCase()) // Get first letter and uppercase
                .join("")
            : "U"}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
