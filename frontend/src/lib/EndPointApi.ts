import Env from "./env";

const Api = `${Env.BACKEND_APP_URL}`;
const client = `${Env.CLIENT_APP_URL}`;
 

export const registerApi = `${Api}/api/auth/register` 
export const  loginApi = `${Api}/api/auth/login`; 
export const Check_loginApi = `${Api}/api/auth/check/credentials` 
export const FORGOT_PASSWORD_URL = `${Api}/api/auth/forget-password` 
export const RESET_PASSWORD_URL = `${Api}/api/auth/reset-password` 
// Ensure ALPHA_VANTAGE_API_KEY is declared or imported before using it


