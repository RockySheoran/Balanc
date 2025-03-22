"use client";
import React, { useEffect } from "react";

// import { SubmitButton } from "../common/SubmitBtn";
import { useFormState } from "react-dom";
// import { loginAction } from "@/app/actions/authActions";
// import { toast } from "sonner";
// import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import { SubmitButton } from "../common/SubmitButton";

export default function Login() {
  const initialState = {
    message: "",
    status: 0,
    errors: {},
    data: {},
  };
 

  return (
    <form >
      <div className="mt-4">
        <Label htmlFor="email">Email</Label>
        <Input placeholder="Type your email" name="email" />
        {/* <span className="text-red-400">{state.errors?.email}</span> */}
      </div>
      <div className="mt-4">
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          placeholder="Type your password"
          name="password"
        />
        <div className="text-right font-bold">
          <Link href="/forgot-password">Forgot Password?</Link>
        </div>
        {/* <span className="text-red-400">{state.errors?.password}</span> */}
      </div>
      <div className="mt-4">
        <SubmitButton />
      </div>
    </form>
  );
}