import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getResume,
  getSettings,
  getGenerationState,
  getComposeDraft,
  saveComposeDraft,
  setGenerationState,
  clearGenerationState,
  clearComposeDraft,
  addToHistory,
} from '../lib/storage'
import { startEmailGeneration } from '../lib/generation'
import { getPageText, sendGmailEmail } from '../lib/gmail'
import type { GeneratedEmail, GenerationState } from '../types'

type Step = 'input' | 'preview'

function applyGenerationState(
  state: GenerationState,
  setters: {
    setEmail: (v: GeneratedEmail | null) => void
    setStep: (v: Step) => void
    setLoading: (v: boolean) => void
    setError: (v: string) => void
  },
) {
  if (state.status === 'generating') {
    setters.setLoading(true)
    setters.setError('')
    setters.setStep('input')
  } else if (state.status === 'done' && state.result) {
    setters.setLoading(false)
    setters.setError('')
    setters.setEmail(state.result)
    setters.setStep('preview')
    chrome.action.setBadgeText({ text: '' })
  } else if (state.status === 'error') {
    setters.setLoading(false)
    setters.setError(state.error ?? 'Generation failed')
    setters.setStep('input')
    chrome.action.setBadgeText({ text: '' })
  } else {
    setters.setLoading(false)
  }
}

export function ComposeTab() {
  const [hrEmail, setHrEmail] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState<GeneratedEmail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasResume, setHasResume] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const hydrated = useRef(false)

  const persistDraft = useCallback((email: string, description: string) => {
    void saveComposeDraft({ hrEmail: email, jobDescription: description })
  }, [])

  const syncFromGeneration = useCallback((state: GenerationState) => {
    applyGenerationState(state, {
      setEmail,
      setStep,
      setLoading,
      setError,
    })
  }, [])

  useEffect(() => {
    Promise.all([
      getResume(),
      getSettings(),
      getComposeDraft(),
      getGenerationState(),
    ]).then(([resume, settings, draft, generation]) => {
      setHasResume(!!resume)
      setHasApiKey(!!settings.groqApiKey)
      setHrEmail(draft.hrEmail)
      setJobDescription(draft.jobDescription)
      syncFromGeneration(generation)
      hydrated.current = true
    })

    const onStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'local') return
      if (changes.composeDraft?.newValue) {
        const draft = changes.composeDraft.newValue as { hrEmail: string; jobDescription: string }
        setHrEmail(draft.hrEmail)
        setJobDescription(draft.jobDescription)
      }
      if (changes.generation?.newValue) {
        syncFromGeneration(changes.generation.newValue as GenerationState)
      }
    }

    chrome.storage.onChanged.addListener(onStorageChange)
    return () => chrome.storage.onChanged.removeListener(onStorageChange)
  }, [syncFromGeneration])

  useEffect(() => {
    if (!hydrated.current) return
    const timer = setTimeout(() => persistDraft(hrEmail, jobDescription), 300)
    return () => clearTimeout(timer)
  }, [hrEmail, jobDescription, persistDraft])

  useEffect(() => {
    if (!hydrated.current || !email || step !== 'preview') return
    const timer = setTimeout(() => {
      void setGenerationState({ status: 'done', result: email })
    }, 300)
    return () => clearTimeout(timer)
  }, [email, step])

  const handleUseCurrentPage = async () => {
    setError('')
    try {
      const text = await getPageText()
      setJobDescription(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read page')
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
    await saveComposeDraft({ hrEmail, jobDescription: jobDescription })

    try {
      const [resume, settings] = await Promise.all([getResume(), getSettings()])
      if (!resume) throw new Error('Upload your resume first (Resume tab)')
      if (!settings.groqApiKey) {
        throw new Error('Add your Groq API key in Settings')
      }

      await startEmailGeneration({
        apiKey: settings.groqApiKey,
        resumeText: resume.extractedText,
        jobDescription,
        hrEmail: hrEmail.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
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

      await clearGenerationState()
      await clearComposeDraft()
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

  const handleBack = async () => {
    await clearGenerationState()
    setEmail(null)
    setStep('input')
    setError('')
  }

  if (!hasResume || !hasApiKey) {
    return (
      <div className="setup-prompt">
        <h3>Setup required</h3>
        <ul>
          {!hasResume && <li>Upload your resume in the <strong>Resume</strong> tab</li>}
          {!hasApiKey && <li>Add your Groq API key in <strong>Settings</strong></li>}
        </ul>
      </div>
    )
  }

  if (step === 'preview' && email) {
    return (
      <div className="compose-preview">
        <p className="preview-heading">Review before sending</p>

        <div className="field">
          <label>Subject</label>
          <input
            type="text"
            value={email.subject}
            onChange={(e) => setEmail({ ...email, subject: e.target.value })}
          />
        </div>

        <div className="field">
          <label>To</label>
          <input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} />
        </div>

        <div className="field">
          <label>Body</label>
          <textarea
            rows={14}
            value={email.body}
            onChange={(e) => setEmail({ ...email, body: e.target.value })}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn secondary" onClick={handleBack} disabled={loading}>
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
      {loading && (
        <p className="generating-banner">
          Generating email… You can close this popup — we'll notify you when it's ready.
        </p>
      )}

      <div className="field">
        <label>HR Email</label>
        <input
          type="email"
          placeholder="recruiter@company.com"
          value={hrEmail}
          onChange={(e) => setHrEmail(e.target.value)}
          disabled={loading}
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
          disabled={loading}
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
