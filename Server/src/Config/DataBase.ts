/** @format */

import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient({
//   log: ["error", "query"],
//   errorFormat: "pretty",
// });
const prisma = new PrismaClient()

export default prisma;
