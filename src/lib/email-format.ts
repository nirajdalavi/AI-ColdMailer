export function normalizeParagraph(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Collapse stray line breaks inside each paragraph block. Keeps sign-off newline. */
export function normalizeEmailBody(body: string): string {
  const blocks = body.split(/\n\n+/)
  if (blocks.length === 0) return body

  const last = blocks[blocks.length - 1]
  const isSignOff = /^Best regards,/i.test(last)

  if (isSignOff && blocks.length > 1) {
    const content = blocks.slice(0, -1).map(normalizeParagraph)
    return [...content, last.trim()].join('\n\n')
  }

  return blocks.map(normalizeParagraph).join('\n\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function plainBodyToHtml(body: string): string {
  return body
    .split(/\n\n+/)
    .map((block) => {
      const inner = escapeHtml(block).replace(/\n/g, '<br>')
      return `<p style="margin:0 0 1em 0;">${inner}</p>`
    })
    .join('')
}

export function base64EncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

const TITLE_ACRONYMS = new Set([
  'AI', 'ML', 'UI', 'UX', 'API', 'AWS', 'GCP', 'SQL', 'NLP', 'LLM', 'HR', 'IT', 'SDE', 'VP', 'QA', 'PM',
  'IOS', 'II', 'III', 'IV', 'SWE', 'FE', 'BE',
])

function titleCaseWord(word: string): string {
  if (!word) return word
  const letters = word.replace(/[^a-zA-Z0-9]/g, '')
  if (!letters) return word

  const upper = letters.toUpperCase()
  if (TITLE_ACRONYMS.has(upper)) return upper
  if (upper === 'IOS') return 'iOS'
  if (letters.length <= 4 && letters === letters.toUpperCase()) return upper

  const lower = word.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** Title-case a job title; keeps hyphen-separated segments and common acronyms (AI, ML, …). */
export function formatJobTitle(title: string): string {
  const cleaned = title
    .replace(/[\u2013\u2014\u2012]/g, ' - ')
    .replace(/Ã¢Â€Â"|â€"|â€"/g, ' - ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s*-\s*[A-Za-z][A-Za-z\s.]*,\s*[A-Z]{2}\s*$/i, '')
    .replace(/,\s*[A-Za-z][A-Za-z\s.]*,\s*[A-Z]{2}\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!cleaned) return 'Role'

  return cleaned
    .split(/\s*-\s*/)
    .map((segment) => segment.split(/\s+/).filter(Boolean).map(titleCaseWord).join(' '))
    .join(' - ')
}

/** Build a consistent subject: "Interest in AI Engineer Role" */
export function buildEmailSubject(jobTitle: string, rawSubject?: string): string {
  let title = jobTitle.trim()
  if (!title && rawSubject) {
    const match = rawSubject.match(/^Interest\s+in\s+(.+)$/i)
    title = match?.[1]?.trim() ?? rawSubject.trim()
  }
  return `Interest in ${formatJobTitle(title || 'Role')}`
}
