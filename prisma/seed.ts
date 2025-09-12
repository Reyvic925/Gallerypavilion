import { PrismaClient, Role, PhotographerStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gallerypavilion.com' },
    update: {},
    create: {
      email: 'admin@gallerypavilion.com',
      name: 'Gallery Pavilion Admin',
      role: Role.ADMIN,
      passwordHash: hashedAdminPassword
    }
  })

  // Create a test user and photographer
  const hashedPassword = await bcrypt.hash('password123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'photographer@test.com' },
    update: {},
    create: {
      email: 'photographer@test.com',
      name: 'Test Photographer',
      role: Role.PHOTOGRAPHER,
      passwordHash: hashedPassword
    }
  })

  const testPhotographer = await prisma.photographer.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      bio: 'Professional photographer specializing in portraits and events',
      status: PhotographerStatus.APPROVED,
      equipment: 'Canon EOS R5, 24-70mm f/2.8, 70-200mm f/2.8',
      experience: '10+ years of professional photography',
      portfolio: 'https://example.com/portfolio',
      specialties: ['Weddings', 'Portraits', 'Events']
    }
  })

  // Create a test gallery
  const testGallery = await prisma.gallery.upsert({
    where: { id: 'test-gallery-1' },
    update: {},
    create: {
      title: 'Wedding Portfolio',
      description: 'Beautiful wedding photography collection',
      photographerId: testPhotographer.id,
      ownerId: testUser.id,
      isPublished: true,
      publishedAt: new Date()
    }
  })

  // Create test photos
  const testPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      thumbUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      title: 'Ceremony Moment',
      caption: 'Beautiful ceremony capture',
      galleryId: testGallery.id,
      metadata: JSON.stringify({
        width: 1920,
        height: 1280,
        format: 'image/jpeg',
        size: 2048000
      })
    },
    {
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop',
      thumbUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop',
      title: 'Reception Dance',
      caption: 'First dance moment',
      galleryId: testGallery.id,
      metadata: JSON.stringify({
        width: 1920,
        height: 1080,
        format: 'image/jpeg',
        size: 1856000
      })
    },
    {
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop',
      thumbUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop',
      title: 'Portrait Session',
      caption: 'Couple portrait in garden',
      galleryId: testGallery.id,
      metadata: JSON.stringify({
        width: 1920,
        height: 1440,
        format: 'image/jpeg',
        size: 2304000
      })
    }
  ]

  for (const photo of testPhotos) {
    await prisma.photo.create({
      data: photo
    })
  }

    // Create test share link
  const testShareLink = await prisma.shareLink.create({
    data: {
      code: 'TEST123',
      galleryId: testGallery.id,
      createdBy: testUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      isActive: true
    }
  })

  console.log('Database seeded successfully!')
  console.log('\n=== ADMIN CREDENTIALS ===')
  console.log('Email: admin@gallerypavilion.com')
  console.log('Password: admin123')
  console.log('Role: admin')
  console.log('\n=== TEST DATA ===')
  console.log('Test invite code: TEST123')
  console.log('Test gallery ID:', testGallery.id)
}
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })