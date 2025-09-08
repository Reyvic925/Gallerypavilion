import { redirect } from 'next/navigation'
import AdminPhotographersClient from './AdminPhotographersClient'

async function getMe() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/auth/me`, { cache: 'no-store' })
  try { return await res.json() } catch(e) { return { user: null } }
}

export default async function AdminPhotographersPage(){
  const data = await getMe()
  if (!data.user || data.user.role !== 'admin') {
    return redirect('/auth/admin-login')
  }

  return <AdminPhotographersClient />
}
