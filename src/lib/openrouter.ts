import type { GeneratedEmail } from '../types'

// Routes to the best available free model on OpenRouter (no per-token cost).
// See https://openrouter.ai/docs/guides/routing/routers/free-router
const DEFAULT_MODEL = 'openrouter/free'

const SYSTEM_PROMPT = `You are an expert career coach who writes concise, personalized cold outreach emails for job applications.

Given a candidate's resume and a job description, write a professional cold email that:
- Opens with a specific, genuine hook tied to the company or role (not generic flattery)
- Highlights 2-3 relevant skills/experiences from the resume that match the job
- Shows enthusiasm without being desperate
- Ends with a clear, low-friction call to action (e.g., brief chat, availability for interview)
- Is 150-250 words in the body
- Uses a professional but warm tone

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "subject": "email subject line",
  "body": "email body text (plain text, use \\n for paragraphs)",
  "company": "company name extracted from job description",
  "jobTitle": "job title extracted from job description"
}`

function parseGeneratedEmail(content: string): GeneratedEmail {
  const trimmed = content.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = (fenced?.[1] ?? trimmed).trim()

  const parsed = JSON.parse(jsonStr) as GeneratedEmail
  if (!parsed.subject || !parsed.body) {
    throw new Error('Invalid email format from model')
  }

  return {
    subject: parsed.subject,
    body: parsed.body,
    company: parsed.company ?? 'Unknown',
    jobTitle: parsed.jobTitle ?? 'Unknown',
  }
}

export async function generateEmail(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
): Promise<GeneratedEmail> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'chrome-extension://ai-coldmailer',
      'X-Title': 'AI ColdMailer',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
        },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message =
      (error as { error?: { message?: string } }).error?.message ??
      `OpenRouter API error (${response.status})`

    if (response.status === 429) {
      throw new Error('Rate limit hit on free tier. Wait a minute and try again.')
    }
    throw new Error(message)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('No response from OpenRouter')

  try {
    return parseGeneratedEmail(content)
  } catch {
    throw new Error('Could not parse email from model response. Try generating again.')
  }
}
