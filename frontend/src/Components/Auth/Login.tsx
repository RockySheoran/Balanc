/** @format */
"use client"

import React, { useState, useEffect, useActionState } from "react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { IoEye, IoEyeOff } from "react-icons/io5"
import { GoogleSubmitBtn } from "../common/GoogleSubmitBtn"
import { loginAction } from "@/Actions/Auth/LoginActions"
import { Button } from "../ui/button"

interface FormState {
  message: string
  status: number
  errors: {
    email?: string[]
    password?: string[]
  }
  data?: {
    email: string
    password: string
  }
}

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [googlePending, setGooglePending] = useState(false)

  const initialState: FormState = {
    message: "",
    status: 0,
    errors: {},
    data: undefined,
  }

  const [state, formAction] = useActionState(loginAction, initialState)

  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200 && state.data) {
      toast.success(state.message)
      signIn("credentials", {
        email: state.data.email,
        password: state.data.password,
        redirect: true,
        callbackUrl: "/dashboard",
      }).catch((error) => {
        // console.error("Sign-in error:", error)
        toast.error("Failed to sign in")
      })
    }
  }, [state])

  const handleGoogleSignIn = async () => {
    setGooglePending(true)
    try {
      await signIn("google", {
        redirect: true,
        callbackUrl: "/dashboard",
      })
    } catch (error) {
      toast.error("Google sign-in failed")
    } finally {
      setGooglePending(false)
    }
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
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

        {/* Password Field */}
        <div>
          <Label htmlFor="password" className="mb-2 block">
            Password
          </Label>
          <div className="relative">
            <Input
              type={passwordVisible ? "text" : "password"}
              id="password"
              placeholder="Type your password"
              name="password"
              aria-describedby="password-error"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
              aria-label={passwordVisible ? "Hide password" : "Show password"}>
              {passwordVisible ? (
                <IoEyeOff className="h-5 w-5" />
              ) : (
                <IoEye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="text-right mt-2">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          {state.errors?.password && (
            <p id="password-error" className="mt-1 text-sm text-red-400">
              {state.errors.password}
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
          className="w-full text-center  px-auto content-center cursor-pointer"
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
      {pending ? "Signing in..." : "Login"}
    </button>
  )
}
