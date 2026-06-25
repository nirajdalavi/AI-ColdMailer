import { useState, useEffect } from 'react'
import { ResumeTab } from './components/ResumeTab'
import { ComposeTab } from './components/ComposeTab'
import { HistoryTab } from './components/HistoryTab'
import { SettingsTab } from './components/SettingsTab'
import './App.css'

type Tab = 'compose' | 'resume' | 'history' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'compose', label: 'Compose' },
  { id: 'resume', label: 'Resume' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('compose')

  useEffect(() => {
    document.body.style.width = '420px'
    document.body.style.minHeight = '520px'
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>AI ColdMailer</h1>
        <p className="subtitle">Tailored job outreach in seconds</p>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'compose' && <ComposeTab />}
        {activeTab === 'resume' && <ResumeTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}
