'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

type Theme = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [elevenLabsKey, setElevenLabsKey] = useState('sk-••••••••••••••••')
  const [pexelsKey, setPexelsKey] = useState('')
  const [defaultVoice, setDefaultVoice] = useState('Adam (en-US)')
  const [videoVisibility, setVideoVisibility] = useState('Unlisted')

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Settings</h1>
        </header>

        <div className="settings">
          <div className="settings-section">
            <h2 className="settings-title">YouTube Connection</h2>
            <div className="youtube-connect">
              <div className="youtube-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </div>
              <div className="youtube-info">
                <div className="youtube-status" style={{ color: 'var(--status-success)' }}>Connected</div>
                <div className="youtube-channel">Tech with Jason - 125K subscribers</div>
              </div>
              <button className="btn btn-secondary">Disconnect</button>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-title">API Keys</h2>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">ElevenLabs API Key</span>
                <span className="settings-label-desc">For voice generation</span>
              </div>
              <input
                type="password"
                className="settings-input"
                placeholder="sk-..."
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Pexels API Key</span>
                <span className="settings-label-desc">For stock footage (optional)</span>
              </div>
              <input
                type="password"
                className="settings-input"
                placeholder="Enter API key..."
                value={pexelsKey}
                onChange={(e) => setPexelsKey(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-title">Appearance</h2>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Theme</span>
                <span className="settings-label-desc">Choose your preferred color scheme</span>
              </div>
              <div className="theme-toggle">
                <span
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  Light
                </span>
                <span
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </span>
                <span
                  className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  System
                </span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-title">Default Settings</h2>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Default Voice</span>
                <span className="settings-label-desc">Used when no voice is specified</span>
              </div>
              <input
                type="text"
                className="settings-input"
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Video Visibility</span>
                <span className="settings-label-desc">Default visibility for new uploads</span>
              </div>
              <input
                type="text"
                className="settings-input"
                value={videoVisibility}
                onChange={(e) => setVideoVisibility(e.target.value)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
