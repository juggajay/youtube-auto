'use client';

import { useState } from 'react';
import type { ScriptNodeConfig, ScriptSection, ScriptSectionType } from '@/stores/nodeConfigStore';

interface Props {
  config: ScriptNodeConfig;
  onChange: (updates: Partial<ScriptNodeConfig>) => void;
}

const SECTION_TYPES: { id: ScriptSectionType; label: string; color: string }[] = [
  { id: 'hook', label: 'Hook', color: 'bg-red-500' },
  { id: 'intro', label: 'Intro', color: 'bg-blue-500' },
  { id: 'point', label: 'Main Point', color: 'bg-green-500' },
  { id: 'story', label: 'Story', color: 'bg-purple-500' },
  { id: 'transition', label: 'Transition', color: 'bg-yellow-500' },
  { id: 'cta', label: 'CTA', color: 'bg-orange-500' },
  { id: 'outro', label: 'Outro', color: 'bg-pink-500' },
];

const getSectionColor = (type: ScriptSectionType) => {
  const found = SECTION_TYPES.find(t => t.id === type);
  return found?.color || 'bg-slate-500';
};

export function StructureTab({ config, onChange }: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...config.sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedItem);

    onChange({ sections: newSections });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const updateSection = (index: number, updates: Partial<ScriptSection>) => {
    const newSections = config.sections.map((s, i) =>
      i === index ? { ...s, ...updates } : s
    );
    onChange({ sections: newSections });
  };

  const addSection = () => {
    const newSection: ScriptSection = {
      id: crypto.randomUUID(),
      name: 'New Section',
      type: 'point',
      duration: '1m',
      instructions: '',
      required: false,
    };
    onChange({ sections: [...config.sections, newSection] });
    setExpandedSection(newSection.id);
  };

  const removeSection = (index: number) => {
    onChange({ sections: config.sections.filter((_, i) => i !== index) });
  };

  const duplicateSection = (index: number) => {
    const section = config.sections[index];
    const newSection: ScriptSection = {
      ...section,
      id: crypto.randomUUID(),
      name: `${section.name} (copy)`,
    };
    const newSections = [...config.sections];
    newSections.splice(index + 1, 0, newSection);
    onChange({ sections: newSections });
  };

  return (
    <div className="structure-tab space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-white">Script Structure</h4>
          <p className="text-sm text-slate-400">Drag to reorder sections, click to edit</p>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
          onClick={addSection}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Sections List */}
      <div className="sections-list space-y-2">
        {config.sections.length === 0 ? (
          <div className="empty-state bg-slate-800/50 rounded-lg p-8 border border-dashed border-slate-600 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-slate-400 text-sm mb-2">No sections defined</p>
            <p className="text-slate-500 text-xs">Select an archetype in the Format tab or add sections manually</p>
          </div>
        ) : (
          config.sections.map((section, index) => (
            <div
              key={section.id}
              className={`section-item bg-slate-800 rounded-lg border transition-all
                ${draggedIndex === index ? 'border-amber-500 opacity-50' : 'border-slate-700'}
                ${expandedSection === section.id ? 'border-slate-600' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Section Header */}
              <div className="section-header flex items-center gap-3 p-3">
                {/* Drag Handle */}
                <div className="drag-handle cursor-grab text-slate-500 hover:text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Section Type Indicator */}
                <div className={`w-2 h-8 rounded-full ${getSectionColor(section.type)}`} />

                {/* Section Content */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full bg-transparent text-white font-medium border-none outline-none focus:ring-0"
                    value={section.name}
                    onChange={(e) => updateSection(index, { name: e.target.value })}
                    placeholder="Section name"
                  />
                </div>

                {/* Type Selector */}
                <select
                  className="bg-slate-700 text-slate-300 text-sm rounded px-2 py-1 border border-slate-600 focus:border-amber-500 focus:ring-0"
                  value={section.type}
                  onChange={(e) => updateSection(index, { type: e.target.value as ScriptSectionType })}
                >
                  {SECTION_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {/* Duration */}
                <input
                  type="text"
                  className="w-16 bg-slate-700 text-slate-300 text-sm rounded px-2 py-1 border border-slate-600 focus:border-amber-500 text-center"
                  value={section.duration}
                  onChange={(e) => updateSection(index, { duration: e.target.value })}
                  placeholder="Duration"
                />

                {/* Expand/Collapse */}
                <button
                  className="text-slate-400 hover:text-white p-1"
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    className="text-slate-400 hover:text-white p-1"
                    onClick={() => duplicateSection(index)}
                    title="Duplicate section"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    className="text-slate-400 hover:text-red-400 p-1"
                    onClick={() => removeSection(index)}
                    title="Remove section"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedSection === section.id && (
                <div className="section-expanded border-t border-slate-700 p-3 space-y-3">
                  {/* Instructions */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Instructions</label>
                    <textarea
                      className="w-full bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:ring-0 resize-none"
                      value={section.instructions}
                      onChange={(e) => updateSection(index, { instructions: e.target.value })}
                      placeholder="Specific instructions for this section..."
                      rows={3}
                    />
                  </div>

                  {/* Required Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                      checked={section.required}
                      onChange={(e) => updateSection(index, { required: e.target.checked })}
                    />
                    <span className="text-sm text-slate-300">Required section (cannot be skipped)</span>
                  </label>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Add Buttons */}
      {config.sections.length > 0 && (
        <div className="quick-add">
          <p className="text-xs text-slate-500 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {SECTION_TYPES.map((type) => (
              <button
                key={type.id}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                onClick={() => {
                  const newSection: ScriptSection = {
                    id: crypto.randomUUID(),
                    name: type.label,
                    type: type.id,
                    duration: type.id === 'hook' ? '15s' : type.id === 'transition' ? '10s' : '1m',
                    instructions: '',
                    required: type.id === 'hook' || type.id === 'outro',
                  };
                  onChange({ sections: [...config.sections, newSection] });
                }}
              >
                <span className={`w-2 h-2 rounded-full ${type.color}`} />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
