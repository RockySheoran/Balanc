"use client";
import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

export function GoogleSubmitBtn({pending,setPending}:any) {
  
  useEffect(()=>{
   
    setPending(true)
  
  },[])
  return (
    <Button className="w-full" disabled={pending}>
      {pending ? (
        "Processing.."
      ) : (
        <div className="flex items-center gap-2">
          <img src="/google.png" alt="google" className="w-4 h-4" />
          <span>Sign in with Google</span>
        </div>
      )}
    </Button>
  )
}