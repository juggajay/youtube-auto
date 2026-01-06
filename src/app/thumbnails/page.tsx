'use client'

import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SaveToElementsModal } from '@/components/elements/SaveToElementsModal'

interface Generation {
  id: string
  prompt: string
  images: string[]
  aspectRatio: string
  timestamp: Date
}

interface SaveModalState {
  isOpen: boolean
  imageData: string
  prompt: string
  aspectRatio: string
}

const ASPECT_RATIOS = ['16:9', '1:1', '4:3', '9:16'] as const
type AspectRatio = typeof ASPECT_RATIOS[number]

export default function ThumbnailStudioPage() {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [saveModalState, setSaveModalState] = useState<SaveModalState>({
    isOpen: false,
    imageData: '',
    prompt: '',
    aspectRatio: '16:9',
  })

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setCurrentImages([])

    try {
      // Generate 4 images in parallel
      const promises = Array(4).fill(null).map(() =>
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio }),
        }).then(res => res.json())
      )

      const results = await Promise.all(promises)
      const images = results
        .filter(r => r.success && r.imageBase64)
        .map(r => `data:image/png;base64,${r.imageBase64}`)

      if (images.length > 0) {
        const newGeneration: Generation = {
          id: Date.now().toString(),
          prompt,
          images,
          aspectRatio,
          timestamp: new Date(),
        }
        setGenerations(prev => [newGeneration, ...prev])
        setSelectedGeneration(newGeneration)
        setCurrentImages(images)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, aspectRatio, isGenerating])

  const handleSelectGeneration = (gen: Generation) => {
    setSelectedGeneration(gen)
    setCurrentImages(gen.images)
    setPrompt(gen.prompt)
  }

  const handleNewGeneration = () => {
    setSelectedGeneration(null)
    setCurrentImages([])
    setPrompt('')
  }

  const handleDownloadAll = () => {
    currentImages.forEach((img, i) => {
      const link = document.createElement('a')
      link.href = img
      link.download = `thumbnail-${i + 1}.png`
      link.click()
    })
  }

  const handleDownloadSingle = (img: string, index: number) => {
    const link = document.createElement('a')
    link.href = img
    link.download = `thumbnail-${index + 1}.png`
    link.click()
  }

  const handleSaveToElements = (img: string) => {
    setSaveModalState({
      isOpen: true,
      imageData: img,
      prompt: selectedGeneration?.prompt || prompt,
      aspectRatio: selectedGeneration?.aspectRatio || aspectRatio,
    })
  }

  const handleCloseSaveModal = () => {
    setSaveModalState(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Thumbnail Studio</h1>
          <div className="header-actions">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '8px' }}>
              Powered by Imagen 4.0
            </span>
          </div>
        </header>

        <div className="thumbnail-studio">
          {/* History Sidebar */}
          <div className="history-sidebar">
            <button className="history-add-btn" onClick={handleNewGeneration} title="New generation">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <div className="history-list">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className={`history-item ${selectedGeneration?.id === gen.id ? 'active' : ''}`}
                  onClick={() => handleSelectGeneration(gen)}
                >
                  {gen.images[0] && (
                    <img src={gen.images[0]} alt={gen.prompt} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className={`studio-main ${currentImages.length === 0 && !isGenerating ? 'empty-state' : 'has-content'}`}>
            {/* Empty state - centered prompt */}
            {currentImages.length === 0 && !isGenerating ? (
              <div className="centered-prompt-container">
                <div className="model-branding">
                  <div className="model-branding-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                  <span className="model-branding-name">Imagen 4.0</span>
                </div>

                {/* Centered Prompt Bar */}
                <div className="prompt-bar centered">
                  <div className="prompt-bar-inner">
                    <div className="prompt-input-wrapper">
                      <textarea
                        className="prompt-textarea"
                        placeholder="Describe your YouTube thumbnail... e.g., 'Dramatic tech review thumbnail with glowing smartphone, dark background, cinematic lighting'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleGenerate()
                          }
                        }}
                      />
                      <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
                          <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
                        </svg>
                        Generate
                      </button>
                    </div>

                    {/* Prompt Controls */}
                    <div className="prompt-controls">
                      <div className="prompt-control-left">
                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                          </svg>
                          Style
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                          </svg>
                          Image prompt
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
                          </svg>
                          Style transfer
                        </button>

                        <button className={`control-pill ${aspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setAspectRatio('16:9')}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2"/>
                          </svg>
                          16:9
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                          </svg>
                          1K
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
                          </svg>
                          Raw
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Prompt Display for selected generation */}
                {selectedGeneration && (
                  <div className="prompt-display">
                    <div className="prompt-text">{selectedGeneration.prompt}</div>
                    <div className="prompt-model">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      Imagen 4.0
                    </div>
                  </div>
                )}

                {/* Image Grid */}
                <div className="image-grid-container">
                  <div className="image-grid">
                  {[0, 1, 2, 3].map((index) => {
                    const img = currentImages[index]
                    const isLoading = isGenerating && !img

                    return (
                      <div key={index} className={`image-cell ${isLoading ? 'loading' : ''}`}>
                        {img ? (
                          <>
                            <img src={img} alt={`Generated thumbnail ${index + 1}`} />
                            <div className="image-overlay">
                              <div className="image-overlay-actions">
                                <button
                                  className="image-overlay-btn"
                                  onClick={() => handleDownloadSingle(img, index)}
                                  title="Download"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                </button>
                                <button
                                  className="image-overlay-btn"
                                  onClick={() => handleSaveToElements(img)}
                                  title="Save to Elements"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                    <polyline points="17 21 17 13 7 13 7 21"/>
                                    <polyline points="7 3 7 8 15 8"/>
                                  </svg>
                                </button>
                                <button className="image-overlay-btn" title="Expand">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="image-cell-placeholder">
                            {isLoading ? (
                              <div className="spinner"></div>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  </div>

                  {/* Action Bar */}
                  <div className="action-bar">
                    <button className="action-btn" onClick={() => handleGenerate()}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6M23 20v-6h-6"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                      </svg>
                      Retry
                    </button>
                    <button className="action-btn" onClick={() => setPrompt(selectedGeneration?.prompt || '')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Reuse parameters
                    </button>
                    <div className="action-btn-divider"></div>
                    <button className="action-btn" onClick={handleDownloadAll}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download all
                    </button>
                    <button className="action-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Publish
                    </button>
                    <button className="action-btn" style={{ color: 'var(--status-error)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Bottom Prompt Bar */}
                <div className="prompt-bar">
                  <div className="prompt-bar-inner">
                    <div className="prompt-input-wrapper">
                      <textarea
                        className="prompt-textarea"
                        placeholder="Describe your YouTube thumbnail... e.g., 'Dramatic tech review thumbnail with glowing smartphone, dark background, cinematic lighting'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleGenerate()
                          }
                        }}
                      />
                      <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                      >
                        {isGenerating ? (
                          <div className="spinner" style={{ width: 18, height: 18 }}></div>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
                            <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
                          </svg>
                        )}
                        Generate
                      </button>
                    </div>

                    {/* Prompt Controls */}
                    <div className="prompt-controls">
                      <div className="prompt-control-left">
                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                          </svg>
                          Style
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                          </svg>
                          Image prompt
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
                          </svg>
                          Style transfer
                        </button>

                        <button className={`control-pill ${aspectRatio === '16:9' ? 'active' : ''}`} onClick={() => setAspectRatio('16:9')}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2"/>
                          </svg>
                          16:9
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                          </svg>
                          1K
                        </button>

                        <button className="control-pill">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
                          </svg>
                          Raw
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Save to Elements Modal */}
      <SaveToElementsModal
        isOpen={saveModalState.isOpen}
        onClose={handleCloseSaveModal}
        imageData={saveModalState.imageData}
        prompt={saveModalState.prompt}
        aspectRatio={saveModalState.aspectRatio}
      />
    </div>
  )
}
