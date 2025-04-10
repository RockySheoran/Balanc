
import React from 'react'

import { redirect } from "next/navigation"

export default function LoginPageWithoutSession() {
  return (
    <div>
        
        
        {redirect('/login')}
    </div>
  )
}