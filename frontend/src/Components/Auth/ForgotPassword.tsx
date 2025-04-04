/** @format */

"use client"
import React, { useEffect } from "react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"

import { useFormState } from "react-dom"

import { toast } from "sonner"
import Link from "next/link"
import { SubmitButton } from "../common/SubmitButton"
import { forgotPasswordAction } from "@/Actions/Auth/forgotPasswordAction"

export default function ForgotPassword() {
  const initialState = {
    message: "",
    status: 0,
    errors: {},
  }
  const [state, formAction] = useFormState(forgotPasswordAction, initialState)

  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200) {
      toast.success(state.message)
    }
  }, [state])

  return (
    <form action={formAction}>
      <div className="mt-4">
        <Label className="my-2" htmlFor="email">
          Email
        </Label>
        <Input placeholder="Type your email" name="email" />
        <span className="text-red-400">{state.errors?.email}</span>
      </div>

      <div className="mt-4 cursor-pointer">
        <SubmitButton />
      </div>
    </form>
  )
}
