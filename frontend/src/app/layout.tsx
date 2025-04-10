/** @format */
import type { Metadata } from "next"
import "./globals.css"

import { Toaster } from "@/Components/ui/sonner"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/options"

import { Inter } from "next/font/google"

import ReduxProvider from "./providers/ReduxProvider"

import SideBarWrapper from "@/Components/base/SideBarWrapper"
import { RedirectToDashboard } from "@/Components/common/RedirectToDashboard"
import ClientSessionProvider from "./providers/ClientSessionProvider"
import { REACT_LOADABLE_MANIFEST } from "next/dist/shared/lib/constants"
import { redirect } from "next/navigation"
import Link from "next/link"
import LoginPageWithoutSession from "@/Components/common/LoginPageWithoutSession"


export const metadata: Metadata = {
  title: {
    default: "Next.js Redux Template",
    template: "%s | Next.js Redux",
  },
  description: "Next.js with Redux Toolkit and TypeScript",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Next.js Redux Template",
  },
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Arial"],
  variable: "--font-inter", // Add CSS variable
  adjustFontFallback: true,
})


// export const revalidate = 60
// export const dynamic = "force-dynamic" // Ensure dynamic behavior

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ReduxProvider>
          <ClientSessionProvider>
            <div className="flex flex-col md:flex-row">
              {/* {!session && (
                <div className="flex-1">
                  <LoginPageWithoutSession/>
              
                </div>
              )} */}
             
             
              {session && (
                <>
                  <SideBarWrapper Session={session} />
                  <RedirectToDashboard  />  
                </>
              )}
              <main className="flex-1 overflow-x-hidden md:mt-0 mt-16">
                {children}
              </main>
            </div>
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: "font-sans",
                },
              }}
            />
          </ClientSessionProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
