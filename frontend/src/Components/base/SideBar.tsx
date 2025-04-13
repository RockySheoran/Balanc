/** @format */

"use client"

import Link from "next/link"
import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"

import LogoutModal from "@/Components/Auth/LogoutModal"
import UserAvatar from "@/Components/base/UserAvatar"
import { Session } from "next-auth"

interface NavItem {
  href: string
  name: string
  icon: React.ReactNode
}

interface SideBarProps {
  session: Session | null
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const NavIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="flex-shrink-0 w-6 h-6">{children}</span>
)

const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
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
      d={
        isCollapsed
          ? "M13 5l7 7-7 7M5 5l7 7-7 7"
          : "M11 19l-7-7 7-7m8 14l-7-7 7-7"
      }
    />
  </svg>
)

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
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
      d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
    />
  </svg>
)

const CopyEmailIcon = () => (
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
)

const SignOutIcon = () => (
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
)

const Sidebar: React.FC<SideBarProps> = ({
  session,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setIsCollapsed(window.innerWidth >= 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [setIsCollapsed])

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev)
    } else {
      setIsCollapsed((prev) => !prev)
    }
  }, [isMobile])

  const handleCopyEmail = useCallback(() => {
    if (session?.user?.email) {
      navigator.clipboard.writeText(session.user.email)
    }
  }, [session?.user?.email])

  const navItems: NavItem[] = useMemo(
    () => [
      {
        href: "/dashboard",
        name: "Dashboard",
        icon: (
          <NavIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </NavIcon>
        ),
      },
      {
        href: "/transactions",
        name: "Transactions",
        icon: (
          <NavIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </NavIcon>
        ),
      },
      {
        href: "/expense",
        name: "Expenses",
        icon: (
          <NavIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 1v22M17 5l-5-4-5 4M17 19l-5 4-5-4" />
              <circle cx="12" cy="12" r="8" />
            </svg>
          </NavIcon>
        ),
      },
      {
        href: "/income",
        name: "Income",
        icon: (
          <NavIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 1v22M7 5l5-4 5 4M7 19l5 4 5-4" />
              <path d="M2 12h20M12 2a10 10 0 110 20 10 10 0 010-20z" />
            </svg>
          </NavIcon>
        ),
      },
      {
        href: "/investment",
        name: "Investments",
        icon: (
          <NavIcon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </NavIcon>
        ),
      },
    ],
    []
  )

  // const userInitial = useMemo(
  //   () => session?.user?.name?.charAt(0).toUpperCase() || "U",
  //   [session?.user?.name]
  // )

  return (
    <>
      <div className={`${isCollapsed ? "w-20" : "md:w-64"}`}>
        {/* Mobile Navbar with Logo and Hamburger */}
        {isMobile && (
          <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm p-4 flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center">
              <h2 className="text-xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-transparent bg-clip-text">
                BALANC
              </h2>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}>
              <HamburgerIcon isOpen={isMobileOpen} />
            </button>
          </nav>
        )}

        {/* Sidebar - Hidden on mobile unless toggled */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 transform ${
            isMobile
              ? isMobileOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : "translate-x-0"
          } transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-20" : "w-64"
          } bg-gradient-to-b from-gray-50 to-gray-100 shadow-xl ${
            isMobile ? "mt-16" : ""
          }`}
          aria-label="Sidebar">
          <div className="flex flex-col h-full p-4">
            {/* Header - Hidden on mobile since we have the navbar */}
            {!isMobile && (
              <header className="flex items-center justify-between mb-8 p-2">
                <Link
                  href="/dashboard"
                  prefetch={true}
                  className="flex items-center"
                  aria-label="Home">
                  <h2
                    className={`text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-transparent bg-clip-text ${
                      isCollapsed ? "hidden" : "block"
                    }`}>
                    BALANC
                  </h2>
                  <h2
                    className={`text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-transparent bg-clip-text ${
                      isCollapsed ? "block" : "hidden"
                    }`}>
                    B
                  </h2>
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="p-1 rounded-full cursor-pointer hover:bg-gray-200"
                  aria-label={
                    isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }>
                  <CollapseIcon isCollapsed={isCollapsed} />
                </button>
              </header>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <Link
                  prefetch={true}
                  key={item.href}
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                    pathname === item.href
                      ? "bg-white shadow-md text-purple-600 font-medium"
                      : "hover:bg-white hover:shadow-md text-gray-700"
                  }`}
                  aria-current={pathname === item.href ? "page" : undefined}>
                  {item.icon}
                  <span className={`ml-3 ${isCollapsed ? "hidden" : "block"}`}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Footer with User Info and Sign Out */}
            <footer className="mt-auto">
              <div
                className={`${
                  isCollapsed ? "" : "block p-3 rounded-lg bg-white shadow-sm"
                }`}>
                <div
                  className={`flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                    isCollapsed ? "p-0.5" : "p-2"
                  }`}>
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                      <UserAvatar
                        user={
                          session?.user || {
                            name: null,
                            email: null,
                            image: null,
                          }
                        }
                      />
                      {/* {!session?.user?.image && (
                        <span className="text-lg">{userInitial}</span>
                      )} */}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {session?.user?.name || "User"}
                        </p>
                      </div>
                      <div className="relative mt-1">
                        <div className="text-xs text-gray-500 overflow-hidden flex items-center">
                          <span className="truncate">
                            {session?.user?.email}
                          </span>
                          <button
                            onClick={handleCopyEmail}
                            className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                            title="Copy email"
                            aria-label="Copy email to clipboard">
                            <CopyEmailIcon />
                          </button>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setOpen(true)}
                className={`flex cursor-pointer items-center w-full p-3 mt-2 rounded-lg text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300 ${
                  isCollapsed ? "justify-center" : ""
                }`}
                aria-label="Sign out">
                <SignOutIcon />
                {!isCollapsed && <span className="ml-3">Sign Out</span>}
              </button>
              <LogoutModal open={open} setOpen={setOpen} />
            </footer>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMobileOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  )
}

export default Sidebar
