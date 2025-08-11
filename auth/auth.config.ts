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
                    const admin = await prisma.admin.findUnique({
                        where: {
                            email: email,
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
                    const user = await prisma.user.findUnique({
                        where: {
                            email,
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
    
} satisfies NextAuthConfig;