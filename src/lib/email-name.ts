const GENERIC_LOCAL_PARTS = new Set([
  'hr',
  'hiring',
  'jobs',
  'job',
  'careers',
  'career',
  'recruit',
  'recruiting',
  'recruiter',
  'talent',
  'people',
  'info',
  'contact',
  'support',
  'admin',
  'noreply',
  'no-reply',
  'hello',
  'team',
  'office',
  'staffing',
  'apply',
  'applications',
  'talentacquisition',
])

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function extractFirstNameFromEmail(email: string): string | null {
  const local = email.trim().split('@')[0]?.toLowerCase() ?? ''
  if (!local) return null

  const segments = local
    .split(/[._-]+/)
    .map((s) => s.replace(/\d+/g, ''))
    .filter((s) => s.length >= 2 && !GENERIC_LOCAL_PARTS.has(s))

  if (segments.length > 0) {
    const first = segments[0]
    if (first.length >= 2 && /^[a-z]+$/.test(first)) {
      return capitalize(first)
    }
  }

  // Single-word local part: antoine@company.com
  if (!/[._-]/.test(local) && local.length >= 3 && /^[a-z]+$/.test(local)) {
    if (!GENERIC_LOCAL_PARTS.has(local)) {
      return capitalize(local)
    }
  }

  return null
}

export function buildGreeting(hrEmail: string): string {
  const name = extractFirstNameFromEmail(hrEmail)
  return name ? `Hi ${name},` : 'Hi there,'
}
