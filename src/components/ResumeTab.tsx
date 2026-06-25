import { useState, useEffect, useRef } from 'react'
import { getResume, saveResume } from '../lib/storage'
import { extractTextFromPdf, fileToBase64 } from '../lib/pdf'
import type { ResumeData } from '../types'

export function ResumeTab() {
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getResume().then(setResume)
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [base64, extractedText] = await Promise.all([
        fileToBase64(file),
        extractTextFromPdf(file),
      ])

      if (!extractedText.trim()) {
        throw new Error('Could not extract text from PDF. Try a text-based PDF.')
      }

      const data: ResumeData = {
        fileName: file.name,
        base64,
        extractedText,
        uploadedAt: new Date().toISOString(),
      }

      await saveResume(data)
      setResume(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="resume-tab">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        hidden
      />

      {resume ? (
        <div className="resume-card">
          <div className="resume-icon">📄</div>
          <div className="resume-info">
            <strong>{resume.fileName}</strong>
            <span className="muted">
              Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
            </span>
            <span className="muted">
              {resume.extractedText.split(/\s+/).length.toLocaleString()} words extracted
            </span>
          </div>
        </div>
      ) : (
        <p className="muted">No resume uploaded yet.</p>
      )}

      {error && <p className="error">{error}</p>}

      <button
        className="btn primary full"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Processing…' : resume ? 'Replace Resume' : 'Upload Resume (PDF)'}
      </button>

      <p className="hint">
        Your resume is stored locally in the browser. Only one PDF is kept at a time.
      </p>
    </div>
  )
}
