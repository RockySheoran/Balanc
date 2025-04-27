/** @format */

// app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/Components/ui/sonner"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/options"
import { Inter } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import SideBarWrapper from "@/Components/base/SideBarWrapper"
import { RedirectToDashboard } from "@/Components/common/RedirectToDashboard"
import ClientSessionProvider from "./providers/ClientSessionProvider"
import { Analytics } from "@vercel/analytics/react"
import ReduxProvider from "./providers/ReduxProvider"

export const metadata: Metadata = {
  title: {
    default: "BALANC",
    template: "%s | BALANC",
  },
  description: "Next.js with Redux Toolkit and TypeScript && A personal management finance app",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", 
})

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
          <ClientSessionProvider >
            <div className="flex flex-col md:flex-row">
              {session && (
                <>
                  <SideBarWrapper Session={session} />
                  <RedirectToDashboard />
                </>
              )}
              <main className="flex-1 overflow-x-hidden md:mt-0">
                {children}
                <Analytics />
                <SpeedInsights />
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
