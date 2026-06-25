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
