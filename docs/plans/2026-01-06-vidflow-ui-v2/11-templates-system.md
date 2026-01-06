# Templates System

## Overview

Templates save entire pipeline configurations for one-click reuse.

## Components

```
src/components/templates/
├── TemplatesPage.tsx           # List view
├── TemplateCard.tsx            # Template preview card
├── SaveTemplateModal.tsx       # Save current config as template
├── LoadTemplateModal.tsx       # Browse and load templates
└── TemplateEditor.tsx          # Edit existing template
```

## Task 1: Templates Page

```tsx
// src/app/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { createBrowserClient } from '@/lib/db/client';
import type { Template } from '@/types/database';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'usage'>('recent');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    setTemplates(data || []);
    setLoading(false);
  };

  const filteredTemplates = templates
    .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'usage') return b.use_count - a.use_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleDelete = async (id: string) => {
    const supabase = createBrowserClient();
    await supabase.from('templates').delete().eq('id', id);
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleDuplicate = async (template: Template) => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('templates')
      .insert({
        ...template,
        id: undefined,
        name: `${template.name} (Copy)`,
        use_count: 0,
        created_at: undefined,
        updated_at: undefined,
      })
      .select()
      .single();

    if (data) {
      setTemplates([data, ...templates]);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const supabase = createBrowserClient();
    await supabase
      .from('templates')
      .update({ is_favorite: !isFavorite })
      .eq('id', id);

    setTemplates(templates.map(t =>
      t.id === id ? { ...t, is_favorite: !isFavorite } : t
    ));
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <h1 className="header-title">Templates</h1>
          <div className="header-actions">
            <input
              type="text"
              placeholder="Search templates..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="sort-select"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name</option>
              <option value="usage">Most Used</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="loading">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <h2>No templates yet</h2>
            <p>Save your first pipeline configuration as a template for easy reuse.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {/* Favorites Section */}
            {filteredTemplates.some(t => t.is_favorite) && (
              <>
                <h2 className="section-title">⭐ Favorites</h2>
                <div className="template-cards">
                  {filteredTemplates
                    .filter(t => t.is_favorite)
                    .map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={() => handleDelete(template.id)}
                        onDuplicate={() => handleDuplicate(template)}
                        onToggleFavorite={() => handleToggleFavorite(template.id, template.is_favorite)}
                      />
                    ))}
                </div>
              </>
            )}

            {/* All Templates */}
            <h2 className="section-title">All Templates</h2>
            <div className="template-cards">
              {filteredTemplates
                .filter(t => !t.is_favorite)
                .map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onDelete={() => handleDelete(template.id)}
                    onDuplicate={() => handleDuplicate(template)}
                    onToggleFavorite={() => handleToggleFavorite(template.id, template.is_favorite)}
                  />
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

## Task 2: TemplateCard

```tsx
// src/components/templates/TemplateCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { Template } from '@/types/database';

interface Props {
  template: Template;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
}

const ARCHETYPE_INFO: Record<string, { icon: string; label: string }> = {
  'tutorial': { icon: '📚', label: 'Tutorial' },
  'list': { icon: '📋', label: 'Listicle' },
  'story': { icon: '📖', label: 'Story' },
  'review': { icon: '⭐', label: 'Review' },
  'vlog': { icon: '🎥', label: 'Vlog' },
};

export function TemplateCard({ template, onDelete, onDuplicate, onToggleFavorite }: Props) {
  const router = useRouter();
  const archetype = ARCHETYPE_INFO[template.archetype_id] || { icon: '📄', label: 'Custom' };

  const handleUse = () => {
    // Navigate to new run with template pre-loaded
    router.push(`/runs/new?template=${template.id}`);
  };

  const handleEdit = () => {
    router.push(`/templates/${template.id}/edit`);
  };

  return (
    <div className="template-card">
      <div className="card-header">
        <span className="archetype-icon">{archetype.icon}</span>
        <h3 className="template-name">{template.name}</h3>
        <button
          className={`favorite-btn ${template.is_favorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
        >
          {template.is_favorite ? '⭐' : '☆'}
        </button>
      </div>

      {template.description && (
        <p className="template-description">{template.description}</p>
      )}

      <div className="template-meta">
        <span className="archetype-label">{archetype.label}</span>
        <span className="use-count">Used {template.use_count} times</span>
      </div>

      {/* Config Summary */}
      <div className="config-summary">
        {template.script_config && <span className="config-badge">📜 Script</span>}
        {template.voice_config && <span className="config-badge">🎙️ Voice</span>}
        {template.thumbnail_config && <span className="config-badge">🖼️ Thumbnail</span>}
        {template.assembly_config && <span className="config-badge">🎬 Assembly</span>}
        {template.publish_config && <span className="config-badge">🚀 Publish</span>}
      </div>

      {/* Review Points */}
      <div className="review-points">
        {template.default_review_script && <span className="review-badge">✓ Review Script</span>}
        {template.default_review_thumbnail && <span className="review-badge">✓ Review Thumbnail</span>}
        {template.default_review_before_publish && <span className="review-badge">✓ Review Before Publish</span>}
      </div>

      <div className="card-actions">
        <button className="btn btn-primary" onClick={handleUse}>
          Use Template
        </button>
        <button className="btn btn-secondary" onClick={handleEdit}>
          Edit
        </button>
        <div className="dropdown">
          <button className="btn-icon">⋮</button>
          <div className="dropdown-menu">
            <button onClick={onDuplicate}>Duplicate</button>
            <button onClick={onDelete} className="danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Task 3: SaveTemplateModal

```tsx
// src/components/templates/SaveTemplateModal.tsx
'use client';

import { useState } from 'react';
import { useNodeConfigStore } from '@/stores/nodeConfigStore';
import { createBrowserClient } from '@/lib/db/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (templateId: string) => void;
}

export function SaveTemplateModal({ isOpen, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    scriptConfig,
    voiceConfig,
    thumbnailConfig,
    assemblyConfig,
    publishConfig,
  } = useNodeConfigStore();

  const { archetypeId, interventions } = useRunInitStore();

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        archetype_id: archetypeId,
        script_config: scriptConfig,
        voice_config: voiceConfig,
        thumbnail_config: thumbnailConfig,
        assembly_config: assemblyConfig,
        publish_config: publishConfig,
        default_review_script: interventions.reviewScript,
        default_review_thumbnail: interventions.reviewThumbnail,
        default_review_before_publish: interventions.reviewBeforePublish,
      })
      .select()
      .single();

    setSaving(false);

    if (data) {
      onSaved(data.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content save-template-modal">
        <div className="modal-header">
          <h2>Save as Template</h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Tutorial Style"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              rows={3}
            />
          </div>

          <div className="config-preview">
            <h4>Includes:</h4>
            <ul>
              {scriptConfig && <li>📜 Script configuration</li>}
              {voiceConfig && <li>🎙️ Voice configuration</li>}
              {thumbnailConfig && <li>🖼️ Thumbnail configuration</li>}
              {assemblyConfig && <li>🎬 Assembly configuration</li>}
              {publishConfig && <li>🚀 Publish configuration</li>}
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Task 4: LoadTemplateModal

```tsx
// src/components/templates/LoadTemplateModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/db/client';
import { useNodeConfigStore } from '@/stores/nodeConfigStore';
import { useRunInitStore } from '@/stores/runInitStore';
import type { Template } from '@/types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LoadTemplateModal({ isOpen, onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { setScriptConfig, setVoiceConfig, setThumbnailConfig, setAssemblyConfig, setPublishConfig } = useNodeConfigStore();
  const { setArchetype, setInterventions } = useRunInitStore();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('templates')
      .select('*')
      .order('use_count', { ascending: false });

    setTemplates(data || []);
    setLoading(false);
  };

  const handleLoad = async () => {
    if (!selectedId) return;

    const template = templates.find(t => t.id === selectedId);
    if (!template) return;

    // Load all configs
    if (template.archetype_id) setArchetype(template.archetype_id);
    if (template.script_config) setScriptConfig(template.script_config);
    if (template.voice_config) setVoiceConfig(template.voice_config);
    if (template.thumbnail_config) setThumbnailConfig(template.thumbnail_config);
    if (template.assembly_config) setAssemblyConfig(template.assembly_config);
    if (template.publish_config) setPublishConfig(template.publish_config);

    setInterventions({
      reviewScript: template.default_review_script,
      reviewThumbnail: template.default_review_thumbnail,
      reviewBeforePublish: template.default_review_before_publish,
    });

    // Increment use count
    const supabase = createBrowserClient();
    await supabase
      .from('templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', selectedId);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content load-template-modal">
        <div className="modal-header">
          <h2>Load Template</h2>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <p>No templates saved yet.</p>
            </div>
          ) : (
            <div className="template-list">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-item ${selectedId === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(template.id)}
                >
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    {template.description && <p>{template.description}</p>}
                  </div>
                  <span className="use-count">{template.use_count} uses</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleLoad}
            disabled={!selectedId}
          >
            Load Template
          </button>
        </div>
      </div>
    </div>
  );
}
```
