'use client'

import { useEffect } from 'react'

interface SessionErrorHandlerProps {
  hasSessionError: boolean
}

export default function SessionErrorHandler({ hasSessionError }: SessionErrorHandlerProps) {
  useEffect(() => {
    if (hasSessionError) {
      // Clear problematic session cookies on the client side
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '__Host-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Also call logout endpoint to clear server-side session state
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
        console.log('Session error: Cleared client cookies and triggered server logout')
      })
    }
  }, [hasSessionError])

  return null
}