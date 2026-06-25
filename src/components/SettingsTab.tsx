import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../lib/storage'
import { checkGmailAuth, connectGmailInteractive, signOutGmail } from '../lib/gmail'

export function SettingsTab() {
  const [apiKey, setApiKey] = useState('')
  const [senderName, setSenderName] = useState('')
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailAvailable, setGmailAvailable] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gmailError, setGmailError] = useState('')

  useEffect(() => {
    const manifest = chrome.runtime.getManifest()
    setGmailAvailable(!!manifest.oauth2?.client_id)

    getSettings().then((s) => {
      setApiKey(s.groqApiKey)
      setSenderName(s.senderName)
      setGmailConnected(s.gmailConnected)
    })
    if (manifest.oauth2?.client_id) {
      checkGmailAuth().then(setGmailConnected)
    }
  }, [])

  const persistSettings = async (gmailConnectedOverride?: boolean) => {
    await saveSettings({
      groqApiKey: apiKey,
      senderName: senderName.trim(),
      gmailConnected: gmailConnectedOverride ?? gmailConnected,
    })
  }

  const handleSave = async () => {
    await persistSettings()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleGmailConnect = async () => {
    setLoading(true)
    setGmailError('')
    try {
      await connectGmailInteractive()
      setGmailConnected(true)
      await persistSettings(true)
    } catch (err) {
      setGmailConnected(false)
      setGmailError(err instanceof Error ? err.message : 'Failed to connect Gmail')
    } finally {
      setLoading(false)
    }
  }

  const handleGmailDisconnect = async () => {
    setLoading(true)
    try {
      await signOutGmail()
      setGmailConnected(false)
      await persistSettings(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-tab">
      <div className="field">
        <label>Your name</label>
        <input
          type="text"
          placeholder="Jane Doe"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        />
        <p className="hint">Used in the email sign-off: Best regards, [your name]</p>
      </div>

      <div className="field">
        <label>Groq API Key</label>
        <input
          type="password"
          placeholder="gsk_…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="hint">
          Free at{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          . Uses Llama 3.3 70B — fast, 1,000 free requests/day.
        </p>
      </div>

      <button className="btn primary full" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Settings'}
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

        {gmailError && <p className="error">{gmailError}</p>}
      </div>
    </div>
  )
}
