import NextAuth from "next-auth"
import authConfig from "./auth.config";

import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma/prisma";

export const runtime = "nodejs";


export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
    unstable_update,
} = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    ...authConfig
})