import { prisma } from '../../../../../lib/prisma'

export async function GET() {
  const pending = await prisma.photographer.findMany({ where: { status: 'pending' }, include: { user: true } })
  return new Response(JSON.stringify({ pending }), { status: 200 })
}
