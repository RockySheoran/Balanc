
class Env{
    static BACKEND_APP_URL :string = process.env.BACKEND_APP_URL as string || "http://localhost:8000";
    static CLIENT_APP_URL :string = process.env.CLIENT_APP_URL as string || "http://localhost:3000";

}
export default Env;