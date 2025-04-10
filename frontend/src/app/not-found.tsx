/** @format */

"use client"

import { Button } from "@/Components/ui/button"
import Image from "next/image"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/Components/ui/alert"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

interface ErrorComponentProps {
  error?: Error & { digest?: string }
  reset?: () => void
}

export default function Error({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  // Safely get error message
  const errorMessage = error?.message || "An unknown error occurred"
  const errorDigest = error?.digest

  useEffect(() => {
    if (error) {
      console.error("Error boundary caught:", error)
      // logErrorToService(error);
    } else {
      console.error("Error boundary triggered, but no error object provided")
    }
  }, [error])

  const handleRefresh = () => {
    reset?.()
    router.refresh()
  }

  const handleGoHome = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <div className="max-w-md w-full space-y-6 text-center">
        <Image
          src="/error.svg"
          width={400}
          height={400}
          alt="Error illustration"
          priority
          className="mx-auto"
        />

        <Alert variant="destructive" className="text-left">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
          {errorDigest && (
            <p className="text-xs mt-2 text-muted-foreground">
              Error ID: {errorDigest}
            </p>
          )}
        </Alert>

        <div className="flex gap-4 justify-center">
          {reset && (
            <Button
              onClick={handleRefresh}
              variant="default"
              size="lg"
              className="min-w-[120px]">
              Try Again
            </Button>
          )}
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="lg"
            className="min-w-[120px]">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
