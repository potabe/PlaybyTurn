"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function signUpWithCredentials(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const result = signUpSchema.safeParse(rawData)

    if (!result.success) {
      return { 
        error: result.error.issues[0]?.message || "Invalid input" 
      }
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred during sign up" }
  }
}
