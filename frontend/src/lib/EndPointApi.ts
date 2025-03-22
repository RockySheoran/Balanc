import Env from "./env";

const Api = `${Env.BACKEND_APP_URL}`;
const client = `${Env.CLIENT_APP_URL}`;
 

export const registerApi = `${Api}/api/auth/register` 
export const  loginApi = `${Api}/api/auth/login`; 
export const Check_loginApi = `${Api}/api/auth/check/credentials` 