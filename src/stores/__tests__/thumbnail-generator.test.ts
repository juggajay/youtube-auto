import { describe, it, expect, beforeEach } from 'vitest';
import { useThumbnailGeneratorStore } from '../thumbnail-generator';

describe('ThumbnailGeneratorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useThumbnailGeneratorStore.setState({
      prompt: '',
      aspectRatio: '16:9',
      images: [],
      queue: [],
      referenceImages: [],
      modalOpen: false,
      modalImageId: null,
      isGenerating: false,
    });
  });

  describe('prompt management', () => {
    it('sets prompt text', () => {
      const { setPrompt } = useThumbnailGeneratorStore.getState();
      setPrompt('A dramatic sunset over mountains');

      expect(useThumbnailGeneratorStore.getState().prompt).toBe(
        'A dramatic sunset over mountains'
      );
    });

    it('updates prompt text', () => {
      const { setPrompt } = useThumbnailGeneratorStore.getState();
      setPrompt('Initial prompt');
      setPrompt('Updated prompt');

      expect(useThumbnailGeneratorStore.getState().prompt).toBe('Updated prompt');
    });
  });

  describe('aspect ratio', () => {
    it('defaults to 16:9', () => {
      expect(useThumbnailGeneratorStore.getState().aspectRatio).toBe('16:9');
    });

    it('sets aspect ratio', () => {
      const { setAspectRatio } = useThumbnailGeneratorStore.getState();
      setAspectRatio('1:1');

      expect(useThumbnailGeneratorStore.getState().aspectRatio).toBe('1:1');
    });

    it('supports all aspect ratios', () => {
      const { setAspectRatio } = useThumbnailGeneratorStore.getState();

      setAspectRatio('4:3');
      expect(useThumbnailGeneratorStore.getState().aspectRatio).toBe('4:3');

      setAspectRatio('9:16');
      expect(useThumbnailGeneratorStore.getState().aspectRatio).toBe('9:16');
    });
  });

  describe('generation queue', () => {
    it('adds single request to queue', () => {
      const { setPrompt, addToQueue } = useThumbnailGeneratorStore.getState();
      setPrompt('Test prompt');
      addToQueue(1);

      const state = useThumbnailGeneratorStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].prompt).toBe('Test prompt');
      expect(state.queue[0].status).toBe('queued');
      expect(state.isGenerating).toBe(true);
    });

    it('adds multiple requests to queue', () => {
      const { setPrompt, addToQueue } = useThumbnailGeneratorStore.getState();
      setPrompt('Batch prompt');
      addToQueue(4);

      const state = useThumbnailGeneratorStore.getState();
      expect(state.queue).toHaveLength(4);
      state.queue.forEach((req) => {
        expect(req.prompt).toBe('Batch prompt');
        expect(req.status).toBe('queued');
      });
    });

    it('captures current aspect ratio in queue', () => {
      const { setPrompt, setAspectRatio, addToQueue } =
        useThumbnailGeneratorStore.getState();
      setPrompt('Square image');
      setAspectRatio('1:1');
      addToQueue(1);

      expect(useThumbnailGeneratorStore.getState().queue[0].aspectRatio).toBe('1:1');
    });

    it('captures reference images in queue', () => {
      useThumbnailGeneratorStore.setState({
        referenceImages: ['ref-1', 'ref-2'],
        prompt: 'With references',
      });

      const { addToQueue } = useThumbnailGeneratorStore.getState();
      addToQueue(1);

      expect(useThumbnailGeneratorStore.getState().queue[0].references).toEqual([
        'ref-1',
        'ref-2',
      ]);
    });

    it('marks request as generating', () => {
      const { setPrompt, addToQueue, startGeneration } =
        useThumbnailGeneratorStore.getState();
      setPrompt('Test');
      addToQueue(1);

      const requestId = useThumbnailGeneratorStore.getState().queue[0].id;
      startGeneration(requestId);

      expect(useThumbnailGeneratorStore.getState().queue[0].status).toBe('generating');
    });

    it('completes generation and adds to images', () => {
      const { setPrompt, addToQueue, startGeneration, completeGeneration } =
        useThumbnailGeneratorStore.getState();
      setPrompt('Complete this');
      addToQueue(1);

      const requestId = useThumbnailGeneratorStore.getState().queue[0].id;
      startGeneration(requestId);
      completeGeneration(requestId, 'base64imagedata');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.images).toHaveLength(1);
      expect(state.images[0].url).toBe('base64imagedata');
      expect(state.images[0].status).toBe('completed');
      expect(state.isGenerating).toBe(false);
    });

    it('handles failed generation', () => {
      const { setPrompt, addToQueue, startGeneration, failGeneration } =
        useThumbnailGeneratorStore.getState();
      setPrompt('Fail this');
      addToQueue(1);

      const requestId = useThumbnailGeneratorStore.getState().queue[0].id;
      startGeneration(requestId);
      failGeneration(requestId, 'API error');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.images).toHaveLength(1);
      expect(state.images[0].status).toBe('failed');
      expect(state.images[0].error).toBe('API error');
    });

    it('keeps generating flag while queue has items', () => {
      const { setPrompt, addToQueue, startGeneration, completeGeneration } =
        useThumbnailGeneratorStore.getState();
      setPrompt('Multiple');
      addToQueue(2);

      const [first, second] = useThumbnailGeneratorStore.getState().queue;
      startGeneration(first.id);
      completeGeneration(first.id, 'image1');

      // Still have one in queue
      expect(useThumbnailGeneratorStore.getState().isGenerating).toBe(true);

      startGeneration(second.id);
      completeGeneration(second.id, 'image2');

      // Now queue is empty
      expect(useThumbnailGeneratorStore.getState().isGenerating).toBe(false);
    });
  });

  describe('reference images', () => {
    it('adds reference image', () => {
      const { addReference } = useThumbnailGeneratorStore.getState();
      addReference('img-1');

      expect(useThumbnailGeneratorStore.getState().referenceImages).toEqual(['img-1']);
    });

    it('prevents duplicate references', () => {
      const { addReference } = useThumbnailGeneratorStore.getState();
      addReference('img-1');
      addReference('img-1');

      expect(useThumbnailGeneratorStore.getState().referenceImages).toEqual(['img-1']);
    });

    it('removes reference image', () => {
      const { addReference, removeReference } = useThumbnailGeneratorStore.getState();
      addReference('img-1');
      addReference('img-2');
      removeReference('img-1');

      expect(useThumbnailGeneratorStore.getState().referenceImages).toEqual(['img-2']);
    });

    it('clears all references', () => {
      const { addReference, clearReferences } = useThumbnailGeneratorStore.getState();
      addReference('img-1');
      addReference('img-2');
      clearReferences();

      expect(useThumbnailGeneratorStore.getState().referenceImages).toEqual([]);
    });

    it('inserts reference to prompt', () => {
      // Add a completed image first
      useThumbnailGeneratorStore.setState({
        images: [
          {
            id: 'test-image-123',
            url: 'imagedata',
            prompt: 'test',
            aspectRatio: '16:9',
            timestamp: Date.now(),
            status: 'completed',
          },
        ],
        prompt: 'Existing prompt',
      });

      const { insertReferenceToPrompt } = useThumbnailGeneratorStore.getState();
      insertReferenceToPrompt('test-image-123');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.prompt).toContain('@ref[test-ima]');
      expect(state.referenceImages).toContain('test-image-123');
    });
  });

  describe('modal', () => {
    beforeEach(() => {
      useThumbnailGeneratorStore.setState({
        images: [
          { id: 'img-1', url: 'url1', prompt: 'p1', aspectRatio: '16:9', timestamp: 1, status: 'completed' },
          { id: 'img-2', url: 'url2', prompt: 'p2', aspectRatio: '16:9', timestamp: 2, status: 'completed' },
          { id: 'img-3', url: 'url3', prompt: 'p3', aspectRatio: '16:9', timestamp: 3, status: 'completed' },
        ],
      });
    });

    it('opens modal with image', () => {
      const { openModal } = useThumbnailGeneratorStore.getState();
      openModal('img-2');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.modalOpen).toBe(true);
      expect(state.modalImageId).toBe('img-2');
    });

    it('closes modal', () => {
      const { openModal, closeModal } = useThumbnailGeneratorStore.getState();
      openModal('img-1');
      closeModal();

      const state = useThumbnailGeneratorStore.getState();
      expect(state.modalOpen).toBe(false);
      expect(state.modalImageId).toBe(null);
    });

    it('navigates to next image', () => {
      const { openModal, navigateModal } = useThumbnailGeneratorStore.getState();
      openModal('img-1');
      navigateModal('next');

      expect(useThumbnailGeneratorStore.getState().modalImageId).toBe('img-2');
    });

    it('navigates to previous image', () => {
      const { openModal, navigateModal } = useThumbnailGeneratorStore.getState();
      openModal('img-2');
      navigateModal('prev');

      expect(useThumbnailGeneratorStore.getState().modalImageId).toBe('img-1');
    });

    it('wraps around on next at end', () => {
      const { openModal, navigateModal } = useThumbnailGeneratorStore.getState();
      openModal('img-3');
      navigateModal('next');

      expect(useThumbnailGeneratorStore.getState().modalImageId).toBe('img-1');
    });

    it('wraps around on prev at beginning', () => {
      const { openModal, navigateModal } = useThumbnailGeneratorStore.getState();
      openModal('img-1');
      navigateModal('prev');

      expect(useThumbnailGeneratorStore.getState().modalImageId).toBe('img-3');
    });
  });

  describe('image management', () => {
    beforeEach(() => {
      useThumbnailGeneratorStore.setState({
        images: [
          { id: 'img-1', url: 'url1', prompt: 'p1', aspectRatio: '16:9', timestamp: 1, status: 'completed' },
          { id: 'img-2', url: 'url2', prompt: 'p2', aspectRatio: '16:9', timestamp: 2, status: 'completed' },
        ],
        referenceImages: ['img-1'],
      });
    });

    it('deletes image', () => {
      const { deleteImage } = useThumbnailGeneratorStore.getState();
      deleteImage('img-1');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.images).toHaveLength(1);
      expect(state.images[0].id).toBe('img-2');
    });

    it('removes deleted image from references', () => {
      const { deleteImage } = useThumbnailGeneratorStore.getState();
      deleteImage('img-1');

      expect(useThumbnailGeneratorStore.getState().referenceImages).toEqual([]);
    });

    it('closes modal when deleting displayed image', () => {
      useThumbnailGeneratorStore.setState({
        modalOpen: true,
        modalImageId: 'img-1',
      });

      const { deleteImage } = useThumbnailGeneratorStore.getState();
      deleteImage('img-1');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.modalOpen).toBe(false);
      expect(state.modalImageId).toBe(null);
    });

    it('adds external image from YouTube', () => {
      const { addExternalImage } = useThumbnailGeneratorStore.getState();
      addExternalImage('https://youtube.com/thumb.jpg', 'youtube');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.images).toHaveLength(3);
      expect(state.images[0].url).toBe('https://youtube.com/thumb.jpg');
      expect(state.images[0].prompt).toContain('youtube');
    });

    it('adds external image from upload', () => {
      const { addExternalImage } = useThumbnailGeneratorStore.getState();
      addExternalImage('data:image/png;base64,...', 'upload');

      const state = useThumbnailGeneratorStore.getState();
      expect(state.images[0].url).toBe('data:image/png;base64,...');
      expect(state.images[0].prompt).toContain('upload');
    });
  });

  describe('image ordering', () => {
    it('adds new images at the beginning (most recent first)', () => {
      const { setPrompt, addToQueue, startGeneration, completeGeneration } =
        useThumbnailGeneratorStore.getState();

      setPrompt('First');
      addToQueue(1);
      const first = useThumbnailGeneratorStore.getState().queue[0].id;
      startGeneration(first);
      completeGeneration(first, 'first-image');

      setPrompt('Second');
      addToQueue(1);
      const second = useThumbnailGeneratorStore.getState().queue[0].id;
      startGeneration(second);
      completeGeneration(second, 'second-image');

      const images = useThumbnailGeneratorStore.getState().images;
      expect(images[0].url).toBe('second-image');
      expect(images[1].url).toBe('first-image');
    });
  });
});
