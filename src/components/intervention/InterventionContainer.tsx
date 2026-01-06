'use client';

import { useRunStore, type Intervention, type InterventionResponse } from '@/stores/runStore';
import { ScriptReviewModal } from './ScriptReviewModal';
import { ThumbnailReviewModal } from './ThumbnailReviewModal';
import { PublishReviewModal } from './PublishReviewModal';

export interface InterventionModalProps {
  intervention: Intervention;
  onDismiss: () => void;
  onRespond: (response: InterventionResponse) => Promise<void>;
}

export function InterventionContainer() {
  const { currentIntervention, dismissIntervention, respondToIntervention } = useRunStore();

  if (!currentIntervention) return null;

  const props: InterventionModalProps = {
    intervention: currentIntervention,
    onDismiss: dismissIntervention,
    onRespond: respondToIntervention,
  };

  switch (currentIntervention.nodeType) {
    case 'script':
      return <ScriptReviewModal {...props} />;
    case 'thumbnail':
      return <ThumbnailReviewModal {...props} />;
    case 'publish':
      return <PublishReviewModal {...props} />;
    default:
      return null;
  }
}
