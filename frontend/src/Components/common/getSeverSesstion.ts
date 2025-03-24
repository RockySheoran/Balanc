import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { Session } from "inspector/promises"
import { getServerSession } from "next-auth"

export const GetServerSession = async (): Promise<any> => {
  const session = await getServerSession(authOptions)
  // const data = JSON.stringify(session)
  return session
}