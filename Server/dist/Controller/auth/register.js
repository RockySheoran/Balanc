/** @format */
import { registerSchema } from "../../Validation/AuthValidation.js";
import { ZodError } from "zod";
import { formatError, renderEmailEjs } from "../../helper.js";
import prisma from "../../Config/DataBase.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { emailQueue, emailQueueName } from "../../Job/emailJob.js";
export const Registration = async (req, res) => {
    try {
        const body = req.body;
        // console.log(body)
        const payload = await registerSchema.parse(body); // Validate the request body
        // console.log(payload)
        // Check if the user already exists
        let user = await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });
        console.log(user);
        if (user) {
            return res.status(422).json({
                errors: { email: "Email already taken. Please use another one" },
            });
        }
        // console.log("ad")
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
        const token = await bcrypt.hash(uuid(), salt);
        const url = `${process.env.APP_URL}/email-verify?email=${payload.email}&token=${token}`;
        const bodyHtml = await renderEmailEjs("verify-email", { name: payload.name, url: url });
        await emailQueue.add(emailQueueName, { to: payload.email, subject: "Email verify", html: bodyHtml });
        // Create the user in the database
        const a = await prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                password: payload.password,
                email_verify_token: token,
                provider: "email"
            },
        });
        console.log(a);
        return res.json({ message: "Account created successfully" });
    }
    catch (error) {
        // console.log("error")
        if (error instanceof ZodError) {
            const errors = formatError(error);
            // console.log(errors)
            return res.status(422).json({ errors: errors });
        }
        return res
            .status(500)
            .json({ message: "Something went wrong. Please try again." });
    }
};
