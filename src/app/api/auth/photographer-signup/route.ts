import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schema for photographer registration
const photographerSignupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().min(1, 'Portfolio URL is required').url('Portfolio must be a valid URL'),
  experience: z.string().min(1, 'Experience level is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  businessName: z.string().optional(),
  bio: z.string().optional(),
  instagram: z.string().optional(),
  equipment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = photographerSignupSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Normalize email to lowercase
    const normalizedEmail = validatedData.email.toLowerCase()
    
    // Create user and photographer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: 'PHOTOGRAPHER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })
      
      // Create photographer profile
      const photographer = await tx.photographer.create({
        data: {
          userId: user.id,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          businessName: validatedData.businessName || null,
          website: validatedData.website || null,
          phone: validatedData.phone || null,
          bio: validatedData.bio || null,
          equipment: validatedData.equipment || null,
          experience: validatedData.experience || null,
          portfolio: validatedData.portfolio || null,
          socialMedia: validatedData.instagram ? {
            instagram: validatedData.instagram
          } : null,
          status: 'pending'
        }
      })
      
      return { user, photographer }
    })
    
    return NextResponse.json({
      message: 'Photographer registration successful',
      photographer: {
        id: result.photographer.id,
        name: result.photographer.name,
        email: result.user.email,
        status: result.photographer.status
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Photographer registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      console.error('Prisma error code:', error.code, 'Message:', error.message)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
