import type { GeneratedEmail } from '../types'
import { buildGreeting } from './email-name'
import { normalizeParagraph, normalizeEmailBody } from './email-format'

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You write professional, warm cold outreach emails for job applications. Match the structure and tone of this example exactly:

---
Subject: Interest in Backend Engineer - New Grad Role

Hi Antoine,

I hope you're doing well. I recently applied for the Backend Engineer - New Grad role at Atoms and wanted to reach out to express my interest.

I'm currently pursuing my MS in Computer Science at USC (graduating May 2026) and have experience building backend systems, APIs, and AI-powered applications in Python. The opportunity to work on real-time distributed systems and edge infrastructure at Atoms is especially exciting to me.

I've attached my resume for your review and would love the opportunity to connect.

Best regards,
Niraj Dalavi
---

Return JSON with these fields (content only — sign-off is added automatically):

- subject: Like "Interest in [Job Title]" using the exact role title from the job description. Use a plain hyphen (-) only. NO location, NO city, NO state. Plain ASCII.
- openingParagraph: Start with "I hope you're doing well." Then mention applying for the specific role at the company and expressing interest.
- middleParagraph: 2-3 sentences — education/status from resume, relevant skills/experience, what about this company or role excites you.
- closingParagraph: Short line about attached resume and wanting to connect (like the example).
- company: Company name from job description
- jobTitle: Job title from job description

Do NOT include a greeting field — the greeting is set from the recipient email automatically.

Use short paragraphs. No bullet points. Sound natural, not robotic.
Each paragraph must be a single line of text with NO line breaks inside it.`

interface ParsedFields {
  subject: string
  greeting?: string
  openingParagraph: string
  middleParagraph: string
  closingParagraph: string
  company?: string
  jobTitle?: string
  body?: string
}

function sanitizeSubject(raw: string): string {
  return raw
    .replace(/[\u2013\u2014\u2012]/g, ' - ')
    .replace(/Ã¢Â€Â"|â€"|â€"/g, ' - ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s*-\s*[A-Za-z][A-Za-z\s.]*,\s*[A-Z]{2}\s*$/i, '')
    .replace(/,\s*[A-Za-z][A-Za-z\s.]*,\s*[A-Z]{2}\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function assembleBody(
  greeting: string,
  opening: string,
  middle: string,
  closing: string,
): string {
  const hi = greeting.trim().endsWith(',') ? greeting.trim() : `${greeting.trim()},`
  return normalizeEmailBody(
    [
      hi,
      '',
      normalizeParagraph(opening),
      '',
      normalizeParagraph(middle),
      '',
      normalizeParagraph(closing),
      '',
      'Best regards,',
      'Niraj Dalavi',
    ].join('\n'),
  )
}

function parseGeneratedEmail(content: string, hrEmail: string): GeneratedEmail {
  const trimmed = content.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = (fenced?.[1] ?? trimmed).trim()

  const parsed = JSON.parse(jsonStr) as ParsedFields
  const greeting = buildGreeting(hrEmail)

  if (
    parsed.openingParagraph &&
    parsed.middleParagraph &&
    parsed.closingParagraph &&
    parsed.subject
  ) {
    return {
      subject: sanitizeSubject(parsed.subject),
      body: assembleBody(
        greeting,
        parsed.openingParagraph,
        parsed.middleParagraph,
        parsed.closingParagraph,
      ),
      company: parsed.company ?? 'Unknown',
      jobTitle: parsed.jobTitle ?? 'Unknown',
    }
  }

  if (parsed.subject && parsed.body) {
    return {
      subject: sanitizeSubject(parsed.subject),
      body: normalizeLegacyBody(parsed.body),
      company: parsed.company ?? 'Unknown',
      jobTitle: parsed.jobTitle ?? 'Unknown',
    }
  }

  throw new Error('Invalid email format from model')
}

function normalizeLegacyBody(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n').trim()
  text = text.replace(/\n*Best regards,?\s*\n*Niraj Dalavi\s*$/i, '').trim()

  const greetingMatch = text.match(/^(Hi [^,\n]+,)/i)
  if (!greetingMatch) return text

  const greeting = greetingMatch[1]
  const rest = text.slice(greeting.length).trim()
  const paragraphs = rest.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

  if (paragraphs.length >= 3) {
    const closing = paragraphs[paragraphs.length - 1]
    const middle = paragraphs[paragraphs.length - 2]
    const opening = paragraphs.slice(0, -2).join(' ')
    return assembleBody(greeting, opening, middle, closing)
  }

  return text
}

export async function generateEmail(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  hrEmail: string,
): Promise<GeneratedEmail> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `RECIPIENT EMAIL: ${hrEmail}\nRECIPIENT FIRST NAME (use in tone if helpful): ${buildGreeting(hrEmail).replace(/^Hi |,$/g, '')}\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message =
      (error as { error?: { message?: string } }).error?.message ??
      `Groq API error (${response.status})`

    if (response.status === 429) {
      throw new Error('Groq rate limit hit. Wait a minute or try again later.')
    }
    throw new Error(message)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('No response from Groq')

  try {
    return parseGeneratedEmail(content, hrEmail)
  } catch {
    throw new Error('Could not parse email from model response. Try generating again.')
  }
}
