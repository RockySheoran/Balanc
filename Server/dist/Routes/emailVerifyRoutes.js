import { Router } from "express";
import { verifyEmail, verifyError } from "../Controller/auth/VerifyEmail.js";
export const emailVerify = Router();
emailVerify.get("/verify-error", verifyError);
emailVerify.get("/email-verify", verifyEmail);
