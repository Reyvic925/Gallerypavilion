import { vi } from 'vitest'

// Global mock for email-related functions to avoid loading nodemailer in tests.
vi.mock('@/lib/email', () => ({
  sendPhotographerApprovalEmail: () => Promise.resolve(true),
  sendPhotographerRejectionEmail: () => Promise.resolve(true),
  sendInviteEmail: () => Promise.resolve(true),
  testEmailConfig: () => Promise.resolve({ success: true })
}))

export {}
