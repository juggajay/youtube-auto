'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/lib/stores/auth'
import { useUIStore, Theme } from '@/lib/stores/ui'

interface Credential {
  provider: string
  isValid: boolean
  lastValidated: string | null
}

export default function SettingsPage() {
  const { profile, refreshProfile, isAuthenticated, initialize } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [defaultVoice, setDefaultVoice] = useState('Adam')
  const [videoVisibility, setVideoVisibility] = useState('unlisted')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [pexelsKey, setPexelsKey] = useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setDefaultVoice(profile.default_voice_id || 'Adam')
      setVideoVisibility(profile.default_video_visibility || 'unlisted')
    }
  }, [profile])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCredentials()
    }
  }, [isAuthenticated])

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/credentials')
      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
    }
  }

  const saveProfile = async () => {
    setIsLoading(true)
    setSaveStatus(null)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          default_voice_id: defaultVoice,
          default_video_visibility: videoVisibility,
        }),
      })

      if (response.ok) {
        await refreshProfile()
        setSaveStatus('Settings saved successfully')
      } else {
        setSaveStatus('Failed to save settings')
      }
    } catch (error) {
      setSaveStatus('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCredential = async (provider: string, key: string) => {
    if (!key) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      })

      if (response.ok) {
        await fetchCredentials()
        setSaveStatus(`${provider} API key saved`)
        // Clear the input
        if (provider === 'elevenlabs') setElevenLabsKey('')
        if (provider === 'pexels') setPexelsKey('')
      } else {
        setSaveStatus(`Failed to save ${provider} API key`)
      }
    } catch (error) {
      setSaveStatus(`Failed to save ${provider} API key`)
    } finally {
      setIsLoading(false)
    }
  }

  const hasCredential = (provider: string) => {
    return credentials.some(c => c.provider === provider && c.isValid)
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Settings</h1>
          {saveStatus && (
            <div className={`save-status ${saveStatus.includes('success') ? 'success' : 'error'}`}>
              {saveStatus}
            </div>
          )}
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
                {profile?.youtube_channel_name ? (
                  <>
                    <div className="youtube-status" style={{ color: 'var(--status-success)' }}>Connected</div>
                    <div className="youtube-channel">{profile.youtube_channel_name}</div>
                  </>
                ) : (
                  <>
                    <div className="youtube-status" style={{ color: 'var(--text-muted)' }}>Not connected</div>
                    <div className="youtube-channel">Connect your YouTube channel to publish videos</div>
                  </>
                )}
              </div>
              <button className="btn btn-secondary">
                {profile?.youtube_channel_name ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-title">API Keys</h2>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">ElevenLabs API Key</span>
                <span className="settings-label-desc">
                  For voice generation
                  {hasCredential('elevenlabs') && (
                    <span style={{ color: 'var(--status-success)', marginLeft: '8px' }}>✓ Connected</span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  className="settings-input"
                  placeholder={hasCredential('elevenlabs') ? '••••••••••••••••' : 'sk-...'}
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => saveCredential('elevenlabs', elevenLabsKey)}
                  disabled={!elevenLabsKey || isLoading}
                >
                  Save
                </button>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Pexels API Key</span>
                <span className="settings-label-desc">
                  For stock footage (optional)
                  {hasCredential('pexels') && (
                    <span style={{ color: 'var(--status-success)', marginLeft: '8px' }}>✓ Connected</span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  className="settings-input"
                  placeholder={hasCredential('pexels') ? '••••••••••••••••' : 'Enter API key...'}
                  value={pexelsKey}
                  onChange={(e) => setPexelsKey(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => saveCredential('pexels', pexelsKey)}
                  disabled={!pexelsKey || isLoading}
                >
                  Save
                </button>
              </div>
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
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <span
                    key={t}
                    className={`theme-option ${theme === t ? 'active' : ''}`}
                    onClick={() => setTheme(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-title">Default Settings</h2>
            <div className="settings-row">
              <div className="settings-label">
                <span className="settings-label-text">Display Name</span>
                <span className="settings-label-desc">Your name shown in the app</span>
              </div>
              <input
                type="text"
                className="settings-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
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
              <select
                className="settings-input"
                value={videoVisibility}
                onChange={(e) => setVideoVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
