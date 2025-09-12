import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isPublished = searchParams.get('isPublished')
    const photographerId = searchParams.get('photographerId')
    const skip = (page - 1) * limit

    const where: {
      isPublished?: boolean
      photographerId?: string
    } = {}
    if (isPublished !== null) where.isPublished = isPublished === 'true'
    if (photographerId) where.photographerId = photographerId

    const [galleries, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        skip,
        take: limit,
        include: {
          photographer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          photos: {
            take: 1,
            select: {
              id: true,
              title: true,
              url: true,
              thumbUrl: true
            }
          },
          shareLinks: {
            select: {
              id: true,
              isActive: true
            }
          },
          _count: {
            select: {
              shareLinks: true,
              photos: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.gallery.count({ where })
    ])

    // Get view statistics for each gallery
    // Transform galleries with stats
    const galleriesWithStats = galleries.map(gallery => {
      return {
        ...gallery,
        stats: {
          photos: gallery._count.photos,
          shareLinks: gallery._count.shareLinks,
          isPublished: gallery.isPublished,
          publishedAt: gallery.publishedAt
        },
        coverPhoto: gallery.photos[0] || null
      }
    })

    return NextResponse.json({
      galleries: galleriesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching galleries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { galleryId, action } = body

    if (!galleryId || !action) {
      return NextResponse.json(
        { error: 'Gallery ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: {
      isPublished?: boolean
      publishedAt?: Date | null
    } = {}

    switch (action) {
      case 'publish':
        updateData = { 
          isPublished: true,
          publishedAt: new Date()
        }
        break
      case 'unpublish':
        updateData = { 
          isPublished: false,
          publishedAt: null
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const gallery = await prisma.gallery.update({
      where: { id: galleryId },
      data: updateData,
      include: {
        photographer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Log the admin action
    await prisma.analytics.create({
      data: {
        type: 'admin_action',
        metadata: {
          action: `gallery_${action}`,
          galleryId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: `Gallery ${action} successful`,
      gallery
    })
  } catch (error) {
    console.error('Error updating gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const galleryId = searchParams.get('id')

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      )
    }

    // Check if gallery exists
    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      include: {
        photos: true,
        collections: true
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Delete gallery and all associated data
    await prisma.$transaction([
      // Delete favorites for photos in this gallery
      prisma.favorite.deleteMany({
        where: {
          photo: {
            galleryId
          }
        }
      }),
      // Delete comments for photos in this gallery
      prisma.comment.deleteMany({
        where: {
          photo: {
            galleryId
          }
        }
      }),
      // Delete purchase requests for photos in this gallery
      prisma.purchaseRequest.deleteMany({
        where: {
          photo: {
            galleryId
          }
        }
      }),
      // Delete analytics for this gallery
      prisma.analytics.deleteMany({
        where: {
          OR: [
            {
              metadata: {
                path: ['galleryId'],
                equals: galleryId
              }
            },
            ...gallery.photos.map(photo => ({
              metadata: {
                path: ['photoId'],
                equals: photo.id
              }
            }))
          ]
        }
      }),
      // Delete photos
      prisma.photo.deleteMany({
        where: { galleryId }
      }),
      // Delete collections
      prisma.collection.deleteMany({
        where: { galleryId }
      }),
      // Delete invites
      prisma.invite.deleteMany({
        where: { galleryId }
      }),
      // Delete gallery
      prisma.gallery.delete({
        where: { id: galleryId }
      })
    ])

    // Log the admin action
    await prisma.analytics.create({
      data: {
        type: 'admin_action',
        metadata: {
          action: 'gallery_deleted',
          galleryId,
          adminId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      message: 'Gallery deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting gallery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}