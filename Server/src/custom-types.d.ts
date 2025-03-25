interface AuthUser {
    Id:string,
    name:string,
    email:string,
   
}

declare namespace Express {
    export interface Request {  
        user?:AuthUser
    }
}
// export default AuthUser;