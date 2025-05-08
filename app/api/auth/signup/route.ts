import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs' // Changed from bcrypt to bcryptjs
import { prisma } from '../../../../lib/prisma'

// Schema for validation
const signupSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .endsWith('@umt.edu.pk', 'Only @umt.edu.pk email addresses are allowed'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        accountStatus: "ACTIVE", // Changed from PENDING to ACTIVE
      },
    });

    // No need for verification email anymore

    return NextResponse.json(
      {
        message: "User registered successfully. You can now sign in.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error); // Fixed missing error object in console.error
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}