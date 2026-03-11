import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/client.js";
import { Env } from "./env.js";

const connectionString = Env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["query"] });

export { prisma };
