import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
<<<<<<< HEAD
}

export function generateSecureUrl(baseUrl: string, token: string): string {
  return `${baseUrl}?token=${token}&expires=${Date.now() + 24 * 60 * 60 * 1000}` // 24 hours
=======
>>>>>>> e2f1b7a994117b9fb44ea004e697ba6989c4c810
}