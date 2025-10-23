import type { User as PrismaUser } from "@prisma/client";

// Exclude password_hash from the Prisma User type
export type SafeUser = {
    id: number;
    name: string;
    email: string;
};

export type User = PrismaUser;