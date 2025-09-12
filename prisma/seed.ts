import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default system settings
  const defaultSettings = [
    {
      key: 'auto_approve_photographers',
      value: 'false',
      type: 'boolean',
      description: 'Automatically approve new photographer registrations'
    },
    {
      key: 'email_notifications',
      value: 'true',
      type: 'boolean',
      description: 'Send email notifications for important events'
    },
    {
      key: 'max_gallery_size',
      value: '100',
      type: 'number',
      description: 'Maximum number of photos per gallery'
    },
    {
      key: 'max_file_size',
      value: '10485760',
      type: 'number',
      description: 'Maximum file size in bytes (10MB)'
    },
    {
      key: 'allowed_file_types',
      value: 'jpg,jpeg,png,webp',
      type: 'string',
      description: 'Comma-separated list of allowed file extensions'
    }
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      }
    })
  }

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gallerypavilion.com' },
    update: {},
    create: {
      email: 'admin@gallerypavilion.com',
      name: 'Gallery Pavilion Admin',
      role: 'admin',
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
      role: 'photographer',
    }
  })

  const testPhotographer = await prisma.photographer.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      name: 'Test Photographer',
      email: 'photographer@test.com',
      bio: 'Professional photographer specializing in portraits and events',
      status: 'approved'
    }
  })

  // Create a test gallery
  const testGallery = await prisma.gallery.upsert({
    where: { id: 'test-gallery-1' },
    update: {},
    create: {
      id: 'test-gallery-1',
      name: 'Wedding Portfolio',
      description: 'Beautiful wedding photography collection',
      photographerId: testPhotographer.id,
      visibility: 'private',
      status: 'active',
    }
  })

  // Create test photos
  const testPhotos = [
    {
      id: 'photo-1',
      filename: 'wedding-1.jpg',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
      title: 'Ceremony Moment',
      description: 'Beautiful ceremony capture',
      galleryId: testGallery.id,
      filesize: 2048000,
      width: 1920,
      height: 1280,
      format: 'image/jpeg'
    },
    {
      id: 'photo-2',
      filename: 'wedding-2.jpg',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop',
      title: 'Reception Dance',
      description: 'First dance moment',
      galleryId: testGallery.id,
      filesize: 1856000,
      width: 1920,
      height: 1080,
      format: 'image/jpeg'
    },
    {
      id: 'photo-3',
      filename: 'wedding-3.jpg',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop',
      title: 'Portrait Session',
      description: 'Couple portrait in garden',
      galleryId: testGallery.id,
      filesize: 2304000,
      width: 1920,
      height: 1440,
      format: 'image/jpeg'
    }
  ]

  for (const photo of testPhotos) {
    await prisma.photo.upsert({
      where: { id: photo.id },
      update: {},
      create: photo
    })
  }

  // Create test invite
  const testInvite = await prisma.invite.upsert({
    where: { code: 'TEST123' },
    update: {},
    create: {
      code: 'TEST123',
      galleryId: testGallery.id,
      type: 'multi_use',
      status: 'active',
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

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })