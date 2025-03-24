

import NavbarComponent from "@/Components/base/navbar";
import { GetServerSession } from "@/Components/common/getSeverSesstion";
import { Button } from "@/Components/ui/button";
import { authOptions } from "./api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";




export default async function Home() {
// const session = await GetServerSession();
const session1 = await getServerSession(authOptions)
// console.log(session)

  return (
    <div className="">
      <NavbarComponent session={session1} />
      {/* <h1>{session?.user?.name}</h1> */}
      {/* <h1>{session1?.user?.name}</h1> */}

      <h1 className="text-6xl">Home page</h1>
    </div>
  )
}
