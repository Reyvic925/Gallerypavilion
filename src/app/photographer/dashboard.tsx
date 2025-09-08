import { redirect } from 'next/navigation'

async function getMe() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/auth/me`, { cache: 'no-store' })
  try {
    return await res.json()
  } catch (e) {
    return { user: null }
  }
}

export default async function PhotographerDashboard() {
  const data = await getMe()
  if (!data.user) {
    if (data.pending) {
      return redirect('/auth/pending')
    }
    return redirect(`/auth/photographer-login?next=/photographer`)
  }

  return <div>Photographer Dashboard (coming soon)</div>
}
