/** @format */
"use client"

import React, { useState, useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { IoEye, IoEyeOff } from "react-icons/io5"
import { registerAction } from "@/Actions/Auth/RegisterActions"
import { GoogleSubmitBtn } from "../common/GoogleSubmitBtn"
import { Button } from "../ui/button"

interface FormState {
  message: string
  status: number
  errors: {
    name?: string[]
    email?: string[]
    password?: string[]
    confirm_password?: string[]
  }
}

export default function Register() {
  const router = useRouter()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [googlePending, setGooglePending] = useState(false)

  const initialState: FormState = {
    message: "",
    status: 0,
    errors: {},
  }

  const [state, formAction] = useActionState(registerAction, initialState)

  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200) {
      toast.success(state.message)
      router.push("/dashboard")
    }
  }, [state, router])

  const handleGoogleSignIn = async () => {
    setGooglePending(true)
    try {
      await signIn("google", { redirect: true, callbackUrl: "/dashboard" })
    } catch (error) {
      toast.error("Google sign-in failed")
    } finally {
      setGooglePending(false)
    }
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        {/* Name Field */}
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Name
          </Label>
          <Input
            placeholder="Type your name"
            name="name"
            id="name"
            aria-describedby="name-error"
          />
          {state.errors?.name && (
            <p id="name-error" className="mt-1 text-sm text-red-400">
              {state.errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <Label htmlFor="email" className="mb-2 block">
            Email
          </Label>
          <Input
            placeholder="Type your email"
            name="email"
            id="email"
            type="email"
            aria-describedby="email-error"
          />
          {state.errors?.email && (
            <p id="email-error" className="mt-1 text-sm text-red-400">
              {state.errors.email}
            </p>
          )}
        </div>

        {/* Password Field with Toggle */}
        <div>
          <Label htmlFor="password" className="mb-2 block">
            Password
          </Label>
          <div className="relative">
            <Input
              type={passwordVisible ? "text" : "password"}
              placeholder="Type your password"
              name="password"
              id="password"
              aria-describedby="password-error"
            />
            <span
              
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              tabIndex={0}>
              {passwordVisible ? (
                <IoEyeOff className="h-5 w-5" />
              ) : (
                <IoEye className="h-5 w-5" />
              )}
            </span>
          </div>
          {state.errors?.password && (
            <p id="password-error" className="mt-1 text-sm text-red-400">
              {state.errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field with Toggle */}
        <div>
          <Label htmlFor="confirm_password" className="mb-2 block">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              type={confirmPasswordVisible ? "text" : "password"}
              placeholder="Confirm your password"
              name="confirm_password"
              id="confirm_password"
              aria-describedby="confirm-password-error"
            />
            <span
              
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
              aria-label={
                confirmPasswordVisible ? "Hide password" : "Show password"
              }
              tabIndex={0}>
              {confirmPasswordVisible ? (
                <IoEyeOff className="h-5 w-5" />
              ) : (
                <IoEye className="h-5 w-5" />
              )}
            </span>
          </div>
          {state.errors?.confirm_password && (
            <p
              id="confirm-password-error"
              className="mt-1 text-sm text-red-400">
              {state.errors.confirm_password}
            </p>
          )}
        </div>

        <SubmitButton />
      </form>

      {/* OAuth Section */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">OR</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full cursor-pointer"
          disabled={googlePending}>
          <GoogleSubmitBtn pending={googlePending} />
        </Button>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className="w-full rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
      disabled={pending}
      aria-disabled={pending}>
      {pending ? "Processing..." : "Register"}
    </button>
  )
}
