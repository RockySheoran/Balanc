/** @format */
import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import route from "./Routes/mainRoutes.js";
import cors from "cors";
import "./Service/index.js";
import { limiter } from "./Config/rateLimit.js";
import { dirname } from 'path';
import helmet from "helmet";
//! Port
const PORT = process.env.PORT || 7000;
const app = express();
//! Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//! Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//! Apply rate limiting
// app.use(rateLimit())
// Set view engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));
//! Route to render and send email like demo
// app.get(
//   "/",
//   asyncHandler(async (req: Request, res: Response) => {
//     const html = await ejs.renderFile(__dirname + `/views/email/welcome.ejs`, {
//       name: "rocky",
//     })
//     // console.log(html)
//     await sendMail("rockysheoran1@gmail.com", "test", html)
//     await emailQueue.add(emailQueueName, {
//       to: "rockysheoran1@gmail.com",
//       subject: "Test",
//       body: html,
//     })
//     //  const newUser = await prisma.user.create({
//     //    data: {
//     //      name :"Rocky",
//     //      email:"d" ,
//     //      password:"fffsddsdgsdgds",
//     //    },
//     //  })
//     //  console.log(newUser)
//     return res.json({ message: "ok" })
//   })
// )
//Queue radis
//! Routes and secure the https request like it only the accpect that request that come from by the origion
const corsOption = {
    origin: ["http://localhost:3000", "https://balanc.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOption));
app.use(route);
//! app limit
app.use(limiter);
//! helmet use for the https sucure  like the strict-transport-security , x-powered-by , contnent-security policy
app.use(helmet());
//! redis config
import "./Config/redis/redis.js";
//! Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
