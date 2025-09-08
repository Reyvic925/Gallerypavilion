"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuthClient'

export default function PhotographerGalleryInvitesPage({ params }: any) {
  const galleryId = params?.id
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) setMsg('You must be signed in as a photographer to create invites')
  }, [loading, user])

  async function createInvite(e: any) {
    e.preventDefault()
    setMsg('')
    if (!email) { setMsg('Please provide an email'); return }
    if (!user?.photographerId) { setMsg('No photographer id found in session'); return }
    setSending(true)
    try {
      const res = await fetch('/api/invite', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ galleryId, clientEmail: email, photographerId: user.photographerId, expiresAt }) })
      const data = await res.json()
      if (res.ok) {
        setMsg('Invite created and email sent (if SMTP configured)')
        setEmail('')
      } else {
        setMsg('Failed to create invite: ' + (data?.error || 'unknown'))
      }
    } catch (err) {
      console.error(err)
      setMsg('Unexpected error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{padding:20}}>
      <h2>Create Invite for Gallery</h2>
      <form onSubmit={createInvite}>
        <div style={{marginBottom:8}}>
          <label>Client email</label><br/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="client@example.com" />
        </div>
        <div style={{marginBottom:8}}>
          <label>Expires at (optional)</label><br/>
          <input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} />
        </div>
        <div><button type="submit" disabled={sending || !user?.photographerId}>{sending ? 'Sending...' : 'Create Invite'}</button></div>
      </form>
      <div style={{marginTop:12}}>{msg}</div>
    </div>
  )
}
