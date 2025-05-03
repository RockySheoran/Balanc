/** @format */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { BiError, BiRefresh, BiHome } from "react-icons/bi"
import { Alert, AlertDescription, AlertTitle } from "@/Components/ui/alert"
import { Button } from "@/Components/ui/button"



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
    }
  }, [error])

  const handleRefresh = () => {
    if (reset) {
      reset()
      router.refresh()
    } else {
      // Fallback refresh if no reset prop
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    router.push("/dashboard")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-md w-full space-y-6 text-center"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image
            src="/error.svg"
            width={400}
            height={400}
            alt="Error illustration"
            priority
            className="mx-auto"
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Alert variant="destructive" className="text-left shadow-lg">
            <div className="flex items-start gap-3">
              <BiError className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <AlertTitle className="text-lg">Something went wrong!</AlertTitle>
                <AlertDescription className="mt-1">
                  {errorMessage}
                </AlertDescription>
                {errorDigest && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Error ID: {errorDigest}
                  </p>
                )}
              </div>
            </div>
          </Alert>
        </motion.div>

        <motion.div 
          className="flex gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleRefresh}
            variant="default"
            size="lg"
            className="min-w-[120px] cursor-pointer gap-2"
          >
            <BiRefresh className="h-5 w-5" />
            Try Again
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="lg"
            className="min-w-[120px] cursor-pointer gap-2"
          >
            <BiHome className="h-5 w-5" />
            Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}