import { useState, useEffect } from 'react'
import { clearHistory, getHistory, removeFromHistory } from '../lib/storage'
import type { ApplicationRecord } from '../types'

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export function HistoryTab() {
  const [history, setHistory] = useState<ApplicationRecord[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

  const handleDelete = async (id: string) => {
    await removeFromHistory(id)
    setHistory((prev) => prev.filter((record) => record.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all application history? This cannot be undone.')) return
    await clearHistory()
    setHistory([])
    setExpanded(null)
  }

  if (history.length === 0) {
    return (
      <div className="empty-state">
        <p>No applications sent yet.</p>
        <p className="muted">Sent emails will appear here.</p>
      </div>
    )
  }

  return (
    <div className="history-tab">
      <div className="history-toolbar">
        <span className="muted">{history.length} application{history.length === 1 ? '' : 's'}</span>
        <button type="button" className="btn-link danger" onClick={handleClearAll}>
          Clear all
        </button>
      </div>

      {history.map((record) => (
        <div key={record.id} className="history-card">
          <div className="history-row">
            <button
              type="button"
              className="history-header"
              onClick={() => setExpanded(expanded === record.id ? null : record.id)}
            >
              <div>
                <strong>{record.company}</strong>
                <span className="muted">{record.jobTitle}</span>
              </div>
              <div className="history-meta">
                <span className={`status ${record.status}`}>{record.status}</span>
                <span className="muted">
                  {new Date(record.sentAt).toLocaleDateString()}
                </span>
              </div>
            </button>
            <button
              type="button"
              className="history-delete"
              aria-label={`Delete ${record.company} application`}
              onClick={() => void handleDelete(record.id)}
            >
              <TrashIcon />
            </button>
          </div>

          {expanded === record.id && (
            <div className="history-detail">
              <p><strong>To:</strong> {record.hrEmail}</p>
              <p><strong>Subject:</strong> {record.subject}</p>
              <pre>{record.body}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
