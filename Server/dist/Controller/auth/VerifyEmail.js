/** @format */
import prisma from "../../Config/DataBase.js";
export const verifyEmail = async (req, res) => {
    const { email, token } = req.query;
    if (email && token) {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (user) {
            if (token === user.email_verify_token) {
                // redirect user to front page
                await prisma.user.update({
                    data: {
                        email_verify_token: null,
                        email_verified_at: new Date().toISOString(),
                    },
                    where: {
                        email: email,
                    },
                });
                return res.redirect(`${process.env.CLIENT_APP_URL}/login`);
            }
        }
        return res.redirect("/verify-error");
    }
    return res.redirect("/verify-error");
};
export const verifyError = async (req, res) => {
    return res.render("auth/verifyEmailError");
};
