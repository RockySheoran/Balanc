import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { useAppSelector } from "@/lib/Redux/store/hooks"
import { stat } from "fs"
import { Session } from "inspector/promises"
import { getServerSession } from "next-auth"

export const GetServerSession = async ()  => {
  const {token} = useAppSelector(state => state.user)
  if(!token) {
    const session = (await getServerSession(authOptions)) as Session & {
      token?: string
    }
    return session
  }
  return token
 
}