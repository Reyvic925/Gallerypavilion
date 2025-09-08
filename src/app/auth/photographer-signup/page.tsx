"use client"
import { useState } from 'react'

export default function PhotographerSignupPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e: any) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/auth/photographer-signup', { method: 'POST', body: JSON.stringify({ email, name, password }), headers: { 'content-type':'application/json' } })
    if (res.ok) setMsg('Signup submitted — pending admin approval')
    else setMsg('Signup failed')
  }

  return (
    <div style={{padding:20}}>
      <h2>Photographer signup</h2>
      <form onSubmit={submit}>
        <div><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" /></div>
        <div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" /></div>
        <div><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" /></div>
        <div><button type="submit">Sign up</button></div>
      </form>
      <div>{msg}</div>
    </div>
  )
}
