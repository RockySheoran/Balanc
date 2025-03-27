
import { getServerSession } from 'next-auth'
import React from 'react'
import { authOptions } from '../api/auth/[...nextauth]/options'

import DashboardWrapper from '@/Components/dashboard/DashboardWrapper'

const page =async () => {
  const session = await getServerSession(authOptions)
  return <DashboardWrapper session={session} />;
  
}

export default page
