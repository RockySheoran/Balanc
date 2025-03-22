/** @format */

import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/Components/ui/sonner"
import { cn } from "@/lib/utils"
import ClientSessionProvider from "./provider/ClientSessionProvider"
import NavbarComponent from "@/Components/base/navbar"


const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Clash App",
  description: "Add your VS to start clashing",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen  font-sans antialiased bg-slate-50",
          fontSans.variable
        )}>
        <ClientSessionProvider>
          
          {children}
          </ClientSessionProvider>
        {/* {children} */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
