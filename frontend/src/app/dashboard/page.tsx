import { getServerSession } from 'next-auth'
import React from 'react'
import { authOptions } from '../api/auth/[...nextauth]/options'
import DashboardClient from '@/Components/dashboard/DashboardClient'
import NavbarComponent from '@/Components/base/navbar'
import { SideBar } from '@/Components/dashboard/com/SideBar'

const page =async () => {
  const session = await getServerSession(authOptions)
  return(
    <div className="dashbord  ">
    <DashboardClient session={session}/>
    
      {/* <NavbarComponent session={session}/> */}
      <div className="sidebar">
      <SideBar session={session} />
     
     </div>
    
    </div>
  )
}

export default page
