import { getServerSession } from 'next-auth'
import React from 'react'
import { authOptions } from '../api/auth/[...nextauth]/options'
import DashboardClient from '@/Components/dashboard/DashboardClient'

const page =async () => {
  const session = await getServerSession(authOptions)
  return(
    <>
    <DashboardClient session={session}/>
    <main>
      <h1>Dashboard Page</h1>
     
    </main>
    </>
  )
}

export default page
