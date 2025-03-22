

import NavbarComponent from "@/Components/base/navbar";
import { Button } from "@/Components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/options";

export default async function Home() {

  return (
    <div className="">
      <NavbarComponent/>
    
      <h1 className="text-6xl">Home page</h1>
    </div>
  )
}
