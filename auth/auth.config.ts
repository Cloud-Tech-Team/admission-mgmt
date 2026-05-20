import { NextAuthConfig } from "next-auth";

import Credentials from "next-auth/providers/credentials";
import { userLoginSchema } from "@/schemas";
import { compare } from "bcryptjs";
import { prisma } from "@/prisma/prisma";


export default {
    // trustHost: true,
    // pages: {
    //     signIn: "/auth/login",
    // },
    providers: [
        Credentials({
            // name: "credentials",
            // credentials: {
            //     email: {
            //         label: "email",
            //         type: "email",
            //         placeholder: "johndoe@gmail.com",
            //     },
            //     password: {
            //         label: "password",
            //         type: "password",
            //         placeholder: "token",
            //     },
            // },
            // type: "credentials",
            async authorize(credentials) {
                const validCredentials = userLoginSchema.safeParse(credentials);
                if (!validCredentials.success) {
                    return null;
                }
                const { email, password, role } = validCredentials.data;
                if (role === "admin") {
                    console.log("yeyeyey")
                    const admin = await prisma.admin.findFirst({
                        where: {
                            email: {
                                equals: email,
                                mode: "insensitive"
                            }
                        },
                    });
                    if (!admin || !admin.password || !admin.email) {
                        return null;
                    }
                    if (admin.password == password) {
                        console.log("admin password match")
                        return {
                            ...admin,
                            role: "admin",
                        };
                    }
                }
                else {
                    const user = await prisma.user.findFirst({
                        where: {
                            email: {
                                equals: email,
                                mode: "insensitive"
                            }
                        },
                    });
                    if (!user || !user.password || !user.email) {
                        return null;
                    }
                    const passMatch = await compare(password, user.password);
                    if (passMatch) {
                        return {
                            ...user,
                            role: "user",
                        };
                    }
                }
                return null;
            },

        }),
        
    ],
    
    // Add callbacks configuration
    callbacks: {
        // Add role and other user data to JWT token
        jwt: async ({ token, user }) => {
            if (user) {
                // Copy user properties to token
                token.role = user.role;
                token.id = user.id;
                token.email = user.email;
                // If you have other properties you need:
                // token.firstName = user.firstName;
                // token.lastName = user.lastName;
                // etc.
                
            }
            return token;
        },
        
        // Add token data to the session
        session: async ({ session, token }) => {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    
} satisfies NextAuthConfig;