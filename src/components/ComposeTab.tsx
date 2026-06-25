import { useState, useEffect } from 'react'
import { getResume, getSettings } from '../lib/storage'
import { generateEmail } from '../lib/openrouter'
import { getPageText, sendGmailEmail } from '../lib/gmail'
import { addToHistory } from '../lib/storage'
import type { GeneratedEmail } from '../types'

type Step = 'input' | 'preview'

export function ComposeTab() {
  const [hrEmail, setHrEmail] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState<GeneratedEmail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasResume, setHasResume] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    Promise.all([getResume(), getSettings()]).then(([resume, settings]) => {
      setHasResume(!!resume)
      setHasApiKey(!!settings.openrouterApiKey)
    })
  }, [])

  const handleUseCurrentPage = async () => {
    setLoading(true)
    setError('')
    try {
      const text = await getPageText()
      setJobDescription(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read page')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!hrEmail.trim()) {
      setError('Please enter the HR email address')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [resume, settings] = await Promise.all([getResume(), getSettings()])
      if (!resume) throw new Error('Upload your resume first (Resume tab)')
      if (!settings.openrouterApiKey) throw new Error('Add your OpenRouter API key in Settings')

      const generated = await generateEmail(
        settings.openrouterApiKey,
        resume.extractedText,
        jobDescription,
      )
      setEmail(generated)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!email || !hrEmail.trim()) return

    setLoading(true)
    setError('')

    try {
      const resume = await getResume()
      if (!resume) throw new Error('Resume not found')

      await sendGmailEmail({
        to: hrEmail.trim(),
        subject: email.subject,
        body: email.body,
        attachmentBase64: resume.base64,
        attachmentFileName: resume.fileName,
      })

      await addToHistory({
        id: crypto.randomUUID(),
        hrEmail: hrEmail.trim(),
        jobTitle: email.jobTitle,
        company: email.company,
        subject: email.subject,
        body: email.body,
        sentAt: new Date().toISOString(),
        status: 'sent',
      })

      setHrEmail('')
      setJobDescription('')
      setEmail(null)
      setStep('input')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setLoading(false)
    }
  }

  if (!hasResume || !hasApiKey) {
    return (
      <div className="setup-prompt">
        <h3>Setup required</h3>
        <ul>
          {!hasResume && <li>Upload your resume in the <strong>Resume</strong> tab</li>}
          {!hasApiKey && <li>Add your OpenRouter API key in <strong>Settings</strong> (free tier available)</li>}
        </ul>
      </div>
    )
  }

  if (step === 'preview' && email) {
    return (
      <div className="compose-preview">
        <div className="field">
          <label>To</label>
          <input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Subject</label>
          <input
            type="text"
            value={email.subject}
            onChange={(e) => setEmail({ ...email, subject: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Body</label>
          <textarea
            rows={12}
            value={email.body}
            onChange={(e) => setEmail({ ...email, body: e.target.value })}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn secondary" onClick={() => setStep('input')} disabled={loading}>
            Back
          </button>
          <button className="btn primary" onClick={handleSend} disabled={loading}>
            {loading ? 'Sending…' : 'Send via Gmail'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="compose-input">
      <div className="field">
        <label>HR Email</label>
        <input
          type="email"
          placeholder="recruiter@company.com"
          value={hrEmail}
          onChange={(e) => setHrEmail(e.target.value)}
        />
      </div>

      <div className="field">
        <div className="label-row">
          <label>Job Description</label>
          <button
            className="btn-link"
            onClick={handleUseCurrentPage}
            disabled={loading}
          >
            Use Current Page
          </button>
        </div>
        <textarea
          rows={10}
          placeholder="Paste the job description here…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <button
        className="btn primary full"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating…' : 'Generate Email'}
      </button>
    </div>
  )
}
