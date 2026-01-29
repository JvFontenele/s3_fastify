import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/client";
import { Env } from "./env";

const connectionString = Env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["query"] });

export { prisma };
