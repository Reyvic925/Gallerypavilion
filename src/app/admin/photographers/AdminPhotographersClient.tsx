"use client"
import { useEffect, useState } from 'react'

export default function AdminPhotographersClient() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState<Record<string,boolean>>({})

  useEffect(()=>{ fetch('/api/admin/photographers/list').then(r=>r.json()).then(d=>setList(d.pending || [])) },[])

  async function action(id: string, type: 'approve' | 'reject'){
    if (!confirm(`Are you sure you want to ${type} this photographer?`)) return
    try {
      setLoading(s => ({ ...s, [id]: true }))
      await fetch(`/api/admin/photographers/${id}/${type}`, { method: 'POST' })
      setList(list.filter(p=>p.id!==id))
    } finally {
      setLoading(s => ({ ...s, [id]: false }))
    }
  }

  return (
    <div style={{padding:20}}>
      <h2>Pending Photographers</h2>
      <ul>
        {list.map(p=> (
          <li key={p.id} style={{marginBottom:10}}>
            <div>{p.user?.email} — {p.name}</div>
            <button disabled={!!loading[p.id]} onClick={()=>action(p.id,'approve')}>{loading[p.id] ? 'Approving…' : 'Approve'}</button>
            <button disabled={!!loading[p.id]} onClick={()=>action(p.id,'reject')}>{loading[p.id] ? 'Processing…' : 'Reject'}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
