/** @format */

import type { Metadata } from "next"

import "./globals.css"
import { Toaster } from "@/Components/ui/sonner"


import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/options"
import { Session } from "inspector/promises"

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
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap", // Optional: reduces layout shift
  variable: "--font-inter", // For CSS variables
})
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = (await getServerSession(authOptions))
  console.log(session) 
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className={`${inter.className} `}>
        <ReduxProvider>
          <ClientSessionProvider>
            <div className="md:flex ">

              {session ? <SideBarWrapper Session={session} /> : <></>}
              {/* <SideBarWrapper /> */}
              <div className={`overflow-x-hidden  md:mx-auto md:flex-2/12`}>
                {children}
              </div>
            </div>
          </ClientSessionProvider>
          <Toaster richColors position="top-right" />
        </ReduxProvider>
      </body>
    </html>
  )
}
