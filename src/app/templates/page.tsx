'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { createClient } from '@/lib/db/client';
import type { Template } from '@/types/database';

type SortOption = 'recent' | 'name' | 'usage';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch templates:', error);
    }

    setTemplates(data || []);
    setLoading(false);
  };

  const filteredTemplates = templates
    .filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'usage') return b.use_count - a.use_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('templates').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete template:', error);
      return;
    }

    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleDuplicate = async (template: Template) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: `${template.name} (Copy)`,
        description: template.description,
        archetype_id: template.archetype_id,
        script_config: template.script_config,
        voice_config: template.voice_config,
        thumbnail_config: template.thumbnail_config,
        assembly_config: template.assembly_config,
        publish_config: template.publish_config,
        default_review_script: template.default_review_script,
        default_review_thumbnail: template.default_review_thumbnail,
        default_review_before_publish: template.default_review_before_publish,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to duplicate template:', error);
      return;
    }

    if (data) {
      setTemplates([data, ...templates]);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('templates')
      .update({ is_favorite: !isFavorite })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle favorite:', error);
      return;
    }

    setTemplates(
      templates.map((t) =>
        t.id === id ? { ...t, is_favorite: !isFavorite } : t
      )
    );
  };

  const favoriteTemplates = filteredTemplates.filter((t) => t.is_favorite);
  const regularTemplates = filteredTemplates.filter((t) => !t.is_favorite);

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
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name</option>
              <option value="usage">Most Used</option>
            </select>
          </div>
        </header>

        <div className="templates">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h2>No templates yet</h2>
              <p>Save your first pipeline configuration as a template for easy reuse.</p>
            </div>
          ) : (
            <div className="templates-content">
              {/* Favorites Section */}
              {favoriteTemplates.length > 0 && (
                <section className="templates-section">
                  <h2 className="templates-section-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Favorites
                  </h2>
                  <div className="templates-grid">
                    {favoriteTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={() => handleDelete(template.id)}
                        onDuplicate={() => handleDuplicate(template)}
                        onToggleFavorite={() =>
                          handleToggleFavorite(template.id, template.is_favorite)
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* All Templates Section */}
              <section className="templates-section">
                <h2 className="templates-section-title">
                  {favoriteTemplates.length > 0 ? 'All Templates' : 'Your Templates'}
                </h2>
                {regularTemplates.length === 0 && favoriteTemplates.length > 0 ? (
                  <p className="templates-section-empty">
                    All your templates are marked as favorites.
                  </p>
                ) : regularTemplates.length === 0 && filter ? (
                  <p className="templates-section-empty">
                    No templates match your search.
                  </p>
                ) : (
                  <div className="templates-grid">
                    {regularTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onDelete={() => handleDelete(template.id)}
                        onDuplicate={() => handleDuplicate(template)}
                        onToggleFavorite={() =>
                          handleToggleFavorite(template.id, template.is_favorite)
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .search-input {
          padding: 8px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          width: 220px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--border-bright);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .sort-select {
          padding: 8px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sort-select:focus {
          outline: none;
          border-color: var(--border-bright);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 16px;
          color: var(--text-muted);
        }

        .empty-state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
        }

        .empty-state-icon {
          width: 64px;
          height: 64px;
          background: var(--bg-elevated);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: var(--text-muted);
        }

        .empty-state-icon svg {
          width: 32px;
          height: 32px;
        }

        .empty-state-container h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .empty-state-container p {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 400px;
        }

        .templates-content {
          padding: 24px 32px;
        }

        .templates-section {
          margin-bottom: 40px;
        }

        .templates-section:last-child {
          margin-bottom: 0;
        }

        .templates-section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .templates-section-title svg {
          color: var(--status-warning);
        }

        .templates-section-empty {
          font-size: 14px;
          color: var(--text-muted);
          padding: 24px;
          text-align: center;
          background: var(--bg-surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius-lg);
        }
      `}</style>
    </div>
  );
}
