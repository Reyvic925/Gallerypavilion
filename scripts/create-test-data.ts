import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

async function createTestData() {
  try {
    // 1. Get or create photographer
    const photographer = await prisma.photographer.findFirst()
    if (!photographer) {
      console.log('No photographer found. Please create a photographer first.')
      return
    }
    
    // 2. Create test user with CLIENT role if not exists
    const email = 'Vameh09@gmail.com'
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('Creating new client user...')
      user = await prisma.user.create({
        data: {
          email,
          name: 'Test Client',
          role: 'CLIENT'
        }
      })
    }
    
    // 3. Get first gallery
    const gallery = await prisma.gallery.findFirst({
      where: { photographerId: photographer.id }
    })
    
    if (!gallery) {
      console.log('No gallery found. Please create a gallery first.')
      return
    }
    
    // 4. Create share link with invite code
    const shareLink = await prisma.shareLink.create({
      data: {
        code: 'TEST' + Math.random().toString(36).substring(7),
        galleryId: gallery.id,
        createdBy: user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    })
    
    console.log('Test data created successfully:', {
      user: { id: user.id, email, role: user.role },
      shareLink: { id: shareLink.id, code: shareLink.code },
      gallery: { id: gallery.id }
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
