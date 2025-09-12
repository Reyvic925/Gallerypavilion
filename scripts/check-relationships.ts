import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Create enriched types based on the Prisma models
type GalleryWithRelations = Prisma.GalleryGetPayload<{
  include: {
    photographer: {
      include: {
        user: true;
      };
    };
  };
}>;

type PhotographerWithGalleries = Prisma.PhotographerGetPayload<{
  include: {
    galleries: true;
  };
}>;

type UserWithGalleries = Prisma.UserGetPayload<{
  include: {
    photographer: true;
    sharedGalleries: true;
    ownedGalleries: true;
  };
}>;

async function checkRelationships() {
  try {
    const email = 'Vameh09@gmail.com';
    console.log('Looking up user:', email);

    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        photographer: true
      }
    });

    if (!user) {
      console.log('No user found with email:', email);
      return;
    }

    console.log('\n=== User ===');
    console.log('ID:', user.id);
    console.log('Email:', user.email || 'No email set');
    console.log('Name:', user.name || 'No name set');
    console.log('Role:', user.role);
    
    // Show photographer profile if exists
    if (user.photographer) {
      const photographer = user.photographer;
      console.log('\n=== Photographer Profile ===');
      console.log('ID:', photographer.id);
      console.log('Status:', photographer.status);
      if (photographer.bio) console.log('Bio:', photographer.bio);
      
      // Get all galleries created by this photographer
      const photographerGalleries = await prisma.gallery.findMany({
        where: {
          photographerId: photographer.id
        }
      });

      if (photographerGalleries.length > 0) {
        console.log('\n=== Created Galleries ===');
        for (const gallery of photographerGalleries) {
          console.log('\nGallery:', gallery.id);
          console.log('Description:', gallery.description || 'No description');
          console.log('Created:', gallery.createdAt);
          console.log('Updated:', gallery.updatedAt);
        }
      }
    }

    // If user is a photographer, get their galleries
    if (user.photographer) {
      const photographer = user.photographer;
      const photographerGalleries = await prisma.gallery.findMany({
        where: {
          photographer: {
            id: photographer.id
          }
        },
        select: {
          id: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              photos: true
            }
          }
        }
      });

      if (photographerGalleries.length > 0) {
        console.log('\n=== Created Galleries (as Photographer) ===');
        console.log(`Total created galleries: ${photographerGalleries.length}`);
        for (const gallery of photographerGalleries) {
          console.log('\nGallery:', gallery.id);
          console.log('Description:', gallery.description || 'No description');
          console.log('Photos:', gallery._count.photos);
          console.log('Created:', gallery.createdAt);
          console.log('Updated:', gallery.updatedAt);
        }
      }
    }

    // Get galleries where user is an owner
    const userWithOwnedGalleries = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        photographer: {
          select: {
            galleries: {
              select: {
                id: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                  select: {
                    photos: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const ownedGalleries = userWithOwnedGalleries?.photographer?.galleries || [];

    if (ownedGalleries.length > 0) {
      console.log('\n=== Owned Galleries ===');
      console.log(`Total owned galleries: ${ownedGalleries.length}`);
      for (const gallery of ownedGalleries) {
        console.log('\nGallery:', gallery.id);
        console.log('Description:', gallery.description || 'No description');
        console.log('Photos:', gallery._count.photos);
        console.log('Created:', gallery.createdAt);
        console.log('Updated:', gallery.updatedAt);
      }
    }

    // Get galleries shared with user
    const userWithSharedGalleries = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        photographer: {
          select: {
            galleries: {
              select: {
                id: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                  select: {
                    photos: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const sharedGalleries = userWithSharedGalleries?.photographer?.galleries || [];

    if (sharedGalleries.length > 0) {
      console.log('\n=== Shared With Me ===');
      console.log(`Total shared galleries: ${sharedGalleries.length}`);
      for (const gallery of sharedGalleries) {
        console.log('\nGallery:', gallery.id);
        console.log('Description:', gallery.description || 'No description');
        console.log('Photos:', gallery._count.photos);
        console.log('Created:', gallery.createdAt);
        console.log('Updated:', gallery.updatedAt);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationships().catch(console.error);
