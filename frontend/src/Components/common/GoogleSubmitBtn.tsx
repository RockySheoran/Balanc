/** @format */

"use client"
import { useFormStatus } from "react-dom"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"

export function GoogleSubmitBtn({ pending, setPending }: { pending: boolean; setPending: (pending: boolean) => void }) {
  useEffect(() => {
    if (pending) {
      const inter = setTimeout(() => {
        setPending(false)
      }, 5000)

      return () => clearTimeout(inter)
    }
  }, [pending])

  return (
    <span className=" text-center px-auto content-center" aria-disabled={pending}>
      {pending ? (
        "Processing..."
      ) : (
        <div
          onClick={() => {
            if (!pending) setPending(true)
          }}
          className="flex items-center gap-2">
          <img src="/google.png" alt="google" className="w-4 h-4" />
          <span>Sign in with Google</span>
        </div>
      )}
    </span>
  )
}
