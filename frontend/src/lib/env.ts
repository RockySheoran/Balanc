
class Env {
  static BACKEND_APP_URL: string =
    (process.env.BACKEND_APP_URL as string) || "http://localhost:8000"
  static CLIENT_APP_URL: string =
    (process.env.CLIENT_APP_URL as string) || "http://localhost:3000"
  static Stock_API: string =
    (process.env.X_RAPIDAPI_KEY1 as string) || ""
  static Stock_API1: string =
    (process.env.X_RAPIDAPI_KEY as string) || ""
}
export default Env;