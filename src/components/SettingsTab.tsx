import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../lib/storage'
import { checkGmailAuth, connectGmail, signOutGmail } from '../lib/gmail'

export function SettingsTab() {
  const [apiKey, setApiKey] = useState('')
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailAvailable, setGmailAvailable] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const manifest = chrome.runtime.getManifest()
    setGmailAvailable(!!manifest.oauth2?.client_id)

    getSettings().then((s) => {
      setApiKey(s.openrouterApiKey)
      setGmailConnected(s.gmailConnected)
    })
    if (manifest.oauth2?.client_id) {
      checkGmailAuth().then(setGmailConnected)
    }
  }, [])

  const handleSave = async () => {
    await saveSettings({ openrouterApiKey: apiKey, gmailConnected })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleGmailConnect = async () => {
    setLoading(true)
    try {
      const connected = await connectGmail()
      setGmailConnected(connected)
      await saveSettings({ openrouterApiKey: apiKey, gmailConnected: connected })
    } finally {
      setLoading(false)
    }
  }

  const handleGmailDisconnect = async () => {
    setLoading(true)
    try {
      await signOutGmail()
      setGmailConnected(false)
      await saveSettings({ openrouterApiKey: apiKey, gmailConnected: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-tab">
      <div className="field">
        <label>OpenRouter API Key</label>
        <input
          type="password"
          placeholder="sk-or-…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="hint">
          Free at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
            openrouter.ai/keys
          </a>
          . Uses free models — no credit card required.
        </p>
      </div>

      <button className="btn primary full" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save API Key'}
      </button>

      <hr />

      <div className="gmail-section">
        <h3>Gmail</h3>
        <p className="muted">
          Connect Gmail to send emails with your resume attached.
        </p>

        {gmailAvailable ? (
          gmailConnected ? (
            <div className="gmail-status connected">
              <span>Connected</span>
              <button
                className="btn secondary"
                onClick={handleGmailDisconnect}
                disabled={loading}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn primary full"
              onClick={handleGmailConnect}
              disabled={loading}
            >
              {loading ? 'Connecting…' : 'Connect Gmail'}
            </button>
          )
        ) : (
          <p className="hint">Gmail is not available in this build.</p>
        )}
      </div>
    </div>
  )
}
