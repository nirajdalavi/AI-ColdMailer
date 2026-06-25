import { useState, useEffect } from 'react'
import { getHistory } from '../lib/storage'
import type { ApplicationRecord } from '../types'

export function HistoryTab() {
  const [history, setHistory] = useState<ApplicationRecord[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

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
      {history.map((record) => (
        <div key={record.id} className="history-card">
          <button
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
