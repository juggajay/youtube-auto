'use client';

import { useRunInitStore } from '@/stores/runInitStore';
import { VideoIdeaForm } from './VideoIdeaForm';
import { ArchetypeSelector } from './ArchetypeSelector';
import { InterventionCheckboxes } from './InterventionCheckboxes';
import { CostEstimator } from './CostEstimator';

export function RunInitiationModal() {
  const { isOpen, step, closeModal, setStep } = useRunInitStore();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">New Video Run</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            onClick={closeModal}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 px-6 py-3 bg-zinc-800/50 border-b border-zinc-700">
          <StepIndicator
            number={1}
            label="Video Idea"
            active={step === 'idea'}
            completed={step === 'archetype' || step === 'review'}
          />
          <div className="flex-1 h-px bg-zinc-700" />
          <StepIndicator
            number={2}
            label="Format"
            active={step === 'archetype'}
            completed={step === 'review'}
          />
          <div className="flex-1 h-px bg-zinc-700" />
          <StepIndicator
            number={3}
            label="Review"
            active={step === 'review'}
            completed={false}
          />
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {step === 'idea' && <VideoIdeaForm onNext={() => setStep('archetype')} />}
          {step === 'archetype' && (
            <ArchetypeSelector
              onNext={() => setStep('review')}
              onBack={() => setStep('idea')}
            />
          )}
          {step === 'review' && (
            <div className="space-y-6">
              <InterventionCheckboxes />
              <CostEstimator />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ number, label, active, completed }: StepIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-white' : completed ? 'text-emerald-400' : 'text-zinc-500'}`}>
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
        ${active ? 'bg-blue-600 text-white' : completed ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400'}
      `}>
        {completed ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
