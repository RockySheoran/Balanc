/** @format */

import type { Metadata } from "next"
import "./globals.css"

import { Toaster } from "@/Components/ui/sonner"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/options"

import { Inter } from "next/font/google"
import ReduxProvider from "./providers/ReduxProvider"
import ClientSessionProvider from "./providers/ClientSessionProvider"
import SideBarWrapper from "@/Components/base/SideBarWrapper"

export const metadata: Metadata = {
  title: "Next.js Redux Template",
  description: "Next.js with Redux Toolkit and TypeScript",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Arial"],
})

export const revalidate = 60

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={inter.className} >
      <body className={inter.className}>
        <ReduxProvider>
          <ClientSessionProvider>
            <div className="md:flex">
              {session && <SideBarWrapper Session={session} />}
              <main className="overflow-x-hidden mt-10 md:mx-auto md:flex-2/12">
                {children}
              </main>
            </div>
          </ClientSessionProvider>
          <Toaster richColors position="top-right" />
        </ReduxProvider>
      </body>
    </html>
  )
}
