/** @format */

"use client"
import React, { useEffect, useState } from "react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"

import { useFormState } from "react-dom"

import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { SubmitButton } from "../common/SubmitButton"
import { resetPasswordAction } from "@/Actions/Auth/resetPasswordAction"
import { IoEye } from "react-icons/io5"
import { IoEyeOff } from "react-icons/io5"
export default function ResetPassword() {
  const [eyeOpen, setEyeOpen] = useState(false)

  const initialState = {
    message: "",
    status: 0,
    errors: {},
  }
  const sParams = useSearchParams()
  const [state, formAction] = useFormState(resetPasswordAction, initialState)
  const router = useRouter()
  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200) {
      toast.success(state.message)
      var timeOut = setTimeout(() => {
        router.replace("/login")
      }, 300)
    }

    return () => {
      clearTimeout(timeOut)
    }
  }, [state])

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={sParams.get("token") ?? ""} />
      <div className="mt-4">
        <Label className="my-2" htmlFor="email">
          Email
        </Label>
        <Input
          placeholder="Type your email"
          name="email"
          readOnly
          value={sParams.get("email") ?? ""}
        />
        <span className="text-red-400">{state.errors?.email}</span>
      </div>
      <div className="mt-4">
        <Label className="my-2" htmlFor="password">
          Password
        </Label>
        <div className="di relative">
          <Input
            type={eyeOpen ? "text" : "password"}
            placeholder="Type your password"
            name="password"
          />
          <span
            onClick={() => setEyeOpen(!eyeOpen)}
            className="absolute top-2 right-2 text-2xl">
            {eyeOpen ? <IoEye /> : <IoEyeOff />}
          </span>
        </div>
        <span className="text-red-400">{state.errors?.password}</span>
      </div>
      <div className="mt-4">
        <Label className="my-2" htmlFor="confirm_password">
          Confirm Password
        </Label>
        <div className="di relative">
          <Input
            type={eyeOpen ? "text" : "password"}
            placeholder="Type your password"
            name="confirm_password"
          />
          <span
            onClick={() => setEyeOpen(!eyeOpen)}
            className="absolute top-2 right-2 text-2xl">
            {eyeOpen ? <IoEye /> : <IoEyeOff />}
          </span>
        </div>
        <span className="text-red-400">{state.errors?.confirm_password}</span>
      </div>
      <div className="mt-4 cursor-pointer">
        <SubmitButton />
      </div>
    </form>
  )
}
