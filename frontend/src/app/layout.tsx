/** @format */

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/Components/ui/sonner"
import StoreProvider from "./providers/StoreProvider"

import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/options"
import { Session } from "inspector/promises"

import ReduxProvider from "./providers/ReduxProvider"
import ClientSessionProvider from "./providers/ClientSessionProvider"

import SideBarWrapper from "@/Components/base/SideBarWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Next.js Redux Template",
  description: "Next.js with Redux Toolkit and TypeScript",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = (await getServerSession(authOptions)) as Session & {
    token?: string
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <ClientSessionProvider>
            <main className=" flex  ">
              <SideBarWrapper />
              <div className="flex-2/4">{children}</div>
            </main>
          </ClientSessionProvider>
          <Toaster richColors position="top-right" />
        </ReduxProvider>
      </body>
    </html>
  )
}
