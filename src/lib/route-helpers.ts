/**
 * Utility helpers for parsing values from API route URLs.
 */
export function getIdFromApiUrl(pathname: string, segmentFromEnd = 2): string | null {
  // Normalize and split path; filter out empty segments to be robust to trailing slashes
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < segmentFromEnd) return null
  return parts[parts.length - segmentFromEnd] ?? null
}

export {}
