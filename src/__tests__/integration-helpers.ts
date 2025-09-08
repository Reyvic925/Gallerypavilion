import { PrismaClient } from '../../prisma/prisma-test-client'

export const testPrisma = new PrismaClient()

export async function resetTestDb() {
  // Clear tables used in tests
  await testPrisma.invite.deleteMany().catch(() => {})
  await testPrisma.gallery.deleteMany().catch(() => {})
  await testPrisma.photographer.deleteMany().catch(() => {})
  await testPrisma.user.deleteMany().catch(() => {})
}
