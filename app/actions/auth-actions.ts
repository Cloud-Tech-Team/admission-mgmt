"use server"
import { auth } from "@/auth/auth"
import { signIn } from "@/auth/auth"
import { userRegisterSchema, userLoginSchema } from "@/schemas"
import { z } from 'zod'
import { prisma } from "@/prisma/prisma"
import { generatePassword } from "@/lib/utils"
import { hash, genSalt } from "bcryptjs"
import { AuthError } from "next-auth"
import { sendPasswordEmail } from "./mail-actions"
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { Quota, Program } from "@prisma/client"
import { generateApplicationNo } from "@/lib/generateApplicationNo"
import { getYearActivationStatus } from "./branch-Actions"

export async function isSessonActive() {
    const session = await auth()
    const user = session?.user?.id
    if (user) {
        return true
    }
    return false
}

export async function loginAdmin(data: z.infer<typeof userLoginSchema>) {
    const parsedResult = userLoginSchema.safeParse(data);
    if (!parsedResult.success) {
        return {
            error: "Wrong Credentials",
            success: false
        };
    }
    const validatedData = parsedResult.data;


    if (!validatedData) {
        return {
            error: "Wrong Credentials",
            success: false
        }
    }

    const { email, password } = validatedData;

    const userExists = await prisma.admin.findUnique({
        where: {
            email: email
        }
    })

    if (!userExists || !userExists.password || !userExists.email) {
        return {
            error: "User not found",
            success: false
        }
    }

    try {
        await signIn("credentials", {
            email: userExists.email,
            password: password,
            role: "admin",
            redirectTo: "/admin/adminHome",
        })
    }
    catch (e) {
        if (e instanceof AuthError) {
            switch (e.type) {
                case "CredentialsSignin":
                    return {
                        error: "Invalid credentials",
                        success: false
                    };
                default:
                    return {
                        error: "Email or password is incorrect",
                        success: false
                    };
            }
        }

        throw e;
    }

    return {
        message: "login success",
        success: true
    }

}

export async function loginAction(data: z.infer<typeof userLoginSchema>): Promise<LoginActionResult> {

    const parsedResult = userLoginSchema.safeParse(data);
    if (!parsedResult.success) {
        return {
            error: "Invalid data",
            success: false
        };
    }
    const validatedData = parsedResult.data;


    if (!validatedData) {
        return {
            error: "Invalid data",
            success: false
        }
    }

    const { email, password } = validatedData;

    const userExists = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!userExists || !userExists.password || !userExists.email) {
        return {
            error: "User not found",
            success: false
        }
    }

    try {
        await signIn("credentials", {
            email: userExists.email,
            password: password,
            role: "user",
            redirect: true,
            redirectTo: "/onboarding",
        })
    }
    catch (e) {
        if (e instanceof AuthError) {
            switch (e.type) {
                case "CredentialsSignin":
                    return {
                        error: "Invalid credentials",
                        success: false
                    };
                default:
                    return {
                        error: "Email or password is incorrect",
                        success: false
                    };
            }
        }

        throw e;
    }

    return {
        message: "login success",
        success: true
    }
}

export async function registerAction(data: z.infer<typeof userRegisterSchema>): Promise<RegisterActionResult> {
    console.log("registerAction triggered", data)
    try {
        const validatedData = userRegisterSchema.parse(data)
        if (!validatedData) {
            return { error: "Invalid data", success: false }
        }

        // Check if the applying year is active for registration
        const yearStatusResult = await getYearActivationStatus(parseInt(validatedData.applyingYear));
        if (!yearStatusResult.success || !yearStatusResult.isActive) {
            return { 
                error: `Registration is currently closed for the ${validatedData.applyingYear} academic year`, 
                success: false 
            };
        }

        // Check if email, mobile number, or Aadhar number already exists
        const existingUser = await prisma.user.findFirst({
            where: {
            OR: [
                { email: validatedData.email },
                { mobileNumber: validatedData.mobileNumber },
                { aadharNo: parseInt(validatedData.aadharNo) },
            ],
            },
        });

        if (existingUser) {
            if (existingUser.email === validatedData.email) {
            return { error: "Email already registered", success: false };
            }
            if (existingUser.mobileNumber === validatedData.mobileNumber) {
            return { error: "Mobile number already registered", success: false };
            }
            if (existingUser.aadharNo === parseInt(validatedData.aadharNo)) {
            return { error: "Aadhar number already registered", success: false };
            }
        }
        const password = generatePassword({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            mobileNumber: validatedData.mobileNumber
        })
        console.log("password", password)
        try {
            // Start the email sending without awaiting
            sendPasswordEmail(validatedData.email, password)
                .then(mailSend => {
                    if (!mailSend.success) {
                        console.log("Email sending failed but user registration continued");
                    }
                })
                .catch(error => {
                    console.error("Async email error:", error);
                });

        }
        catch (e) {
            console.log("Error initiating email send", e);
            return { error: "Email could not be sent", success: false };
        }
        const salt = await genSalt(10)
        const hashedPassword = await hash(password, salt)


        const applicationNo = await generateApplicationNo(validatedData.quota as Quota, validatedData.program as Program, validatedData.applyingYear);

        const createdUser = await prisma.user.create({
            data: {
                firstName: validatedData.firstName,
                middleName: validatedData.middleName,
                lastName: validatedData.lastName,
                email: validatedData.email,
                password: hashedPassword,
                mobileNumber: validatedData.mobileNumber,
                gender: validatedData.gender,
                dob: new Date(validatedData.dob),
                applyingYear: validatedData.applyingYear,
                quota: validatedData.quota as Quota,
                program: validatedData.program as Program,
                aadharNo: parseInt(validatedData.aadharNo),
                religion: validatedData.religion,
                cast: validatedData.cast,
                createdAt: new Date(),
                applicationNo: applicationNo
            },
        })
        if (!createdUser) {
            return { error: "User not created", success: false }
        }
        return { message: "User created successfully", success: true }

    } catch (e) {
        console.log(e)
        return { error: "user creation failed", success: false }
    }
}

export async function getUser(email: string) {

    try {

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
    catch (error) {
        console.error("Error fetching user:", error);
        throw new Error("Failed to fetch user data");
    }

}



// Request password reset
export async function requestPasswordReset(email: string) {
    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security, don't reveal if the email exists or not
            return {
                success: true,
                message: "If your email exists in our system, you will receive a password reset link"
            };
        }

        // Generate a random token
        const token = randomBytes(32).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 3600000); // 1 hour from now

        // Store token in database
        await prisma.passwordReset.create({
            data: {
                email: user.email,
                token,
                expiresAt,
            },
        });

        // Send email with reset link
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, resetLink);

        return {
            success: true,
            message: "Password reset link sent"
        };
    } catch (error) {
        console.error('Password reset request error:', error);
        return {
            success: false,
            error: "An error occurred while processing your request"
        };
    }
}

// Validate reset token
export async function validateResetToken(token: string) {
    try {
        const passwordReset = await prisma.passwordReset.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
                used: false,
            },
        });

        return { valid: !!passwordReset };
    } catch (error) {
        console.error('Token validation error:', error);
        return { valid: false };
    }
}

// Reset password
export async function resetPassword(token: string, newPassword: string) {
    try {
        // Find the valid token
        const passwordReset = await prisma.passwordReset.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
                used: false,
            },
        });

        if (!passwordReset) {
            return {
                success: false,
                error: "Invalid or expired password reset token"
            };
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: passwordReset.email },
        });

        if (!user) {
            return {
                success: false,
                error: "User not found"
            };
        }

        // Hash the new password
        const hashedPassword = await hash(newPassword, 10);

        // Update the user's password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        // Mark the token as used
        await prisma.passwordReset.update({
            where: { id: passwordReset.id },
            data: { used: true },
        });

        return {
            success: true,
            message: "Password has been successfully reset"
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: "An error occurred while resetting your password"
        };
    }
}

// Helper function to send email
async function sendPasswordResetEmail(email: string, resetLink: string) {
    // Configure nodemailer (use environment variables in production)
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.SENDER_PASSWORD,
        }
    });

    // Email content
    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: 'Reset Your Password',
        html: `
      <div>
        <h1>Reset Your Password</h1>
        <p>You requested a password reset for your NRI College Admission account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #c8202f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this reset, you can safely ignore this email.</p>
      </div>
    `,
    };

    // Send email
    return transporter.sendMail(mailOptions);
}