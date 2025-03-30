/** @format */

"use client"
import React, { useActionState, useEffect, useState } from "react"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"

import { useFormState } from "react-dom"

import { toast } from "sonner"

import Link from "next/link"
import { loginAction } from "@/Actions/Auth/LoginActions"
import { SubmitButton } from "../common/SubmitButton"
import { signIn } from "next-auth/react"
import { IoEye } from "react-icons/io5"
import { IoEyeOff } from "react-icons/io5"
import { GoogleSubmitBtn } from "../common/GoogleSubmitBtn"

export default function Login() {
  const [eyeOpen, setEyeOpen] = useState(false)
  const initialState = {
    message: "",
    status: 0,
    errors: {},
    data: {},
  }
  const [state, formAction] = useActionState(loginAction, initialState)

  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200) {
      toast.success(state.message)
      console.log(state.data?.email, state.data?.password)
      console.log(state.data)
      signIn("credentials", {
        email: state.data?.email,
        password: state.data?.password,
        redirect: true,
        callbackUrl: "/dashboard",
      }).catch((error) => {
        console.error("Sign-in error:", error)
      })
    }
  }, [state])
  const googleSignIn = async () => {
    await signIn("google", { redirect: true, callbackUrl: "/dashboard" })
  }
  const [pending,setPending ] = useState(false);

  return (
    <div className="">
      <form action={formAction}>
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
              id="password"
              placeholder="Type your password"
              name="password"
            />
            <span
              onClick={() => setEyeOpen(!eyeOpen)}
              className="absolute top-2 right-2 text-2xl cursor-pointer">
              {eyeOpen ? <IoEye /> : <IoEyeOff />}
            </span>
          </div>
          <div className="text-right font-bold">
            <Link href="/forgot-password">Forgot Password?</Link>
          </div>
          <span className="text-red-400 ">{state.errors?.password}</span>
        </div>
        <div className="sumbitButton">
          <div className="mt-4">
            <SubmitButton />
          </div>
        </div>
      </form>
      <div className="">
        <h1 className="text-center text-red-500">--OR--</h1>
        <div  onClick={googleSignIn} className="google">
          <GoogleSubmitBtn pending={pending} setPending={setPending} />
        </div>
      </div>
    </div>
  )
}
