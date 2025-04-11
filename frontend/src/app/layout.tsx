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

import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: {
    default: "BALANC",
    template: "%s | BALANC",
  },
  description: "Next.js with Redux Toolkit and TypeScript",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "BALANC",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "logo",
        type: "image/webp",
      },
    ],
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
console.log(session)
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ReduxProvider>
          <ClientSessionProvider>
            <div className="flex flex-col md:flex-row">
              

              {session && (
                <>
                  <SideBarWrapper Session={session} />
                  <RedirectToDashboard />
                </>
              )}
              <main className="flex-1 overflow-x-hidden md:mt-0 ">
                {children}
                <Analytics />
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
