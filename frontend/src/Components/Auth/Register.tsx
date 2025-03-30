/** @format */

"use client"
import React, { useActionState, useEffect, useState } from "react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"

import { useFormState } from "react-dom"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { registerAction } from "@/Actions/Auth/RegisterActions"
import { SubmitButton } from "../common/SubmitButton"
import { IoEye } from "react-icons/io5"
import { IoEyeOff } from "react-icons/io5"
import { GoogleSubmitBtn } from "../common/GoogleSubmitBtn"
import { signIn } from "next-auth/react"
export default function Register() {
  const [eyeOpen, setEyeOpen] = useState(false)
  const router = useRouter()
  const initialState = {
    message: "",
    status: 0,
    errors: {},
  }
  const [state, formAction] = useActionState(registerAction, initialState)

  // console.log("object")
  console.log(state)
  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200) {
      toast.success(state.message)
    }
  }, [state])
  const googleSignIn = async () => {
    await signIn("google", { redirect: true, callbackUrl: "/dashboard" })
  }
  const [pending, setPending] = useState(false)

  return (
    <>
      <form action={formAction}>
        <div className="mt-4">
          <Label className="my-2" htmlFor="name">
            Name
          </Label>
          <Input placeholder="Type your name" name="name" id="name" />
          <span className="text-red-400">{state.errors?.name}</span>
        </div>
        <div className="mt-4">
          <Label className="my-2" htmlFor="email">
            Email
          </Label>
          <Input placeholder="Type your email" name="email" id="email" />
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
              id="password"
            />
            <span
              onClick={() => setEyeOpen(!eyeOpen)}
              className="absolute cursor-pointer top-2 right-2 text-2xl">
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
              id="confirm_password"
            />
            <span
              onClick={() => setEyeOpen(!eyeOpen)}
              className="absolute cursor-pointer top-2 right-2 text-2xl">
              {eyeOpen ? <IoEye /> : <IoEyeOff />}
            </span>
          </div>
          <span className="text-red-400">{state.errors?.confirm_password}</span>
        </div>
        <div className="sumbitButton">
          <div className="mt-4">
            <SubmitButton />
          </div>
        </div>
      </form>
      <div className="">
        <h1 className="text-center text-red-500">--OR--</h1>
        <div onClick={googleSignIn} className="google">
          <GoogleSubmitBtn pending={pending} setPending={setPending} />
        </div>
      </div>
    </>
  )
}
