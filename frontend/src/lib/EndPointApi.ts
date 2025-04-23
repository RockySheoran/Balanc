import Env from "./env";

const Api = `${Env.BACKEND_APP_URL}`;
const client = `${Env.CLIENT_APP_URL}`;
export const  Stock_API_URL = `${Env.Stock_API}`;
export const  Stock_API_URL1 = `${Env.Stock_API1}`;
 

export const registerApi = `${Api}/api/auth/register` 
export const  loginApi = `${Api}/api/auth/login`; 
export const loginGoogleApi = `${Api}/api/auth/google` 
export const Check_loginApi = `${Api}/api/auth/check/credentials` 
export const FORGOT_PASSWORD_URL = `${Api}/api/auth/forget-password` 
export const RESET_PASSWORD_URL = `${Api}/api/auth/reset-password` 
export const CREATE_ACCOUNT_URL = `${Api}/api/account/createAccount` 
export const GET_ALL_ACCOUNT_URL = `${Api}/api/account/getAccount` 
export const DELETE_ACCOUNT_URL = `${Api}/api/account/accountDelete` 
export const CREATE_TRANSACTION_URL = `${Api}/api/transaction/createTransaction` 
export const ALL_TRANSACTION_URL = `${Api}/api/transaction/transactions` 
export const DELETE_TRANSACTION_URL = `${Api}/api/transaction/deleteTransaction` 
export const CREATE_INVEST_URL = `${Api}/api/investments/createInvestment` 
export const ALL_INVEST_URL = `${Api}/api/investments/getAllInvestments` 
export const UPDATE_INVEST_URL = `${Api}/api/investments/updateInvestment` 
// Ensure ALPHA_VANTAGE_API_KEY is declared or imported before using it


