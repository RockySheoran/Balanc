/** @format */
"use client"; // Required for interactivity

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react"; // Assuming you're using NextAuth.js
import LogoutModal from "@/Components/Auth/LogoutModal";
import UserAvatar from "@/Components/base/UserAvatar";
interface SideBarProps {
  session: any; // Replace 'Session' with your actual session type
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}
export const SideBar: React.FC<SideBarProps> = ({ session ,isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(!isMobileOpen)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  const navItems = [
    {
      href: "/dashboard",
      name: "Dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      href: "/transactions",
      name: "Transaction",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      href: "/investment",
      name: "Investment",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    },
    {
      href: "/budget",
      name: "Budget",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      href: "/reports",
      name: "Reports",
      icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
  ]

  return (
    <>
      <div className={`${isCollapsed ? "w-20 " : "md:w-64 "}`}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleSidebar}
          className={`md:hidden absolute top-4   transform  left-4 z-50 p-2 rounded-md bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg ${
            !isMobileOpen ? "translate-x-0" : "translate-x-48"
          } md:translate-x-0 transition-transform duration-300 ease-in-out
          }`}>
          {isMobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-20 delay-[40]" : "w-64 delay-[40]"
          } bg-gradient-to-b from-gray-50 to-gray-100 shadow-xl`}>
          <div className="flex flex-col h-full p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 p-2">
              <Link href="/" className="flex items-center">
                <h2
                  className={`text-2xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 text-transparent bg-clip-text ${
                    isCollapsed ? "hidden" : "block"
                  }`}>
                  PFMA
                </h2>
                <h2
                  className={`text-2xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 text-transparent bg-clip-text ${
                    isCollapsed ? "block" : "hidden"
                  }`}>
                  P
                </h2>
              </Link>
              <button
                onClick={toggleSidebar}
                className="hidden md:block p-1 rounded-full hover:bg-gray-200">
                {isCollapsed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                    pathname === item.href
                      ? "bg-white shadow-md text-purple-600"
                      : "hover:bg-white hover:shadow-md text-gray-700"
                  }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  <span className={`ml-3 ${isCollapsed ? "hidden" : "block"}`}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Footer with User Info and Sign Out */}
            <div className="mt-auto">
              <div
                className={`${
                  isCollapsed ? "" : "block p-3 rounded-lg bg-white shadow-sm "
                }`}>
                <div
                  className={`flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                    isCollapsed ? "p-0.5" : "p-2"
                  }`}>
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      <UserAvatar user={session?.user} />
                    </div>
                  </div>

                  <div
                    className={`flex-1 min-w-0 ${
                      isCollapsed ? "hidden" : "block"
                    }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {session?.user?.name || "User"}
                      </p>
                    </div>

                    <div className="relative mt-1">
                      <div className="text-xs text-gray-500 overflow-hidden flex items-center">
                        <span className="truncate">{session?.user?.email}</span>
                        {/* Copy email button */}
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              session?.user?.email || ""
                            )
                          }
                          className="ml-1  text-gray-400 hover:text-gray-600 flex-shrink-0"
                          title="Copy email">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        </button>
                      </div>
                      {/* Gradient fade effect - only visible when text overflows */}
                      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setOpen(true) // Open the confirmation modal
                }}
                className={`flex items-center w-full p-3 mt-2 rounded-lg text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300 ${
                  isCollapsed ? "justify-center" : ""
                }`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {!isCollapsed && <span className="ml-3">Sign Out</span>}
              </button>
              <LogoutModal open={open} setOpen={setOpen} />
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </div>
    </>
  )
}