import { useState, useEffect, useRef } from 'react';

// Module-level cache so the model persists across StrictMode remounts
let cachedModel = null;
let modelLoadPromise = null;

/**
 * Custom hook to load the COCO-SSD model from TensorFlow.js CDN.
 * Manages model lifecycle, loading progress, and error state.
 * The model is loaded once and reused across all detections.
 */
export default function useTFModel() {
  const [model, setModel] = useState(cachedModel);
  const [isLoading, setIsLoading] = useState(!cachedModel);
  const [loadProgress, setLoadProgress] = useState(cachedModel ? 100 : 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Already loaded from cache
    if (cachedModel) {
      setModel(cachedModel);
      setIsLoading(false);
      setLoadProgress(100);
      return;
    }

    let cancelled = false;

    // Simulate incremental progress while the model loads
    const progressInterval = setInterval(() => {
      if (cancelled) return;
      setLoadProgress(prev => {
        if (prev < 85) {
          const increment = Math.random() * 8 + 2;
          return Math.min(prev + increment, 85);
        }
        return prev;
      });
    }, 300);

    async function loadModel() {
      try {
        // Reuse in-flight promise if another mount already started loading
        if (!modelLoadPromise) {
          modelLoadPromise = (async () => {
            // Wait for TF.js globals to be available from CDN
            let attempts = 0;
            while (!window.cocoSsd && attempts < 80) {
              await new Promise(r => setTimeout(r, 250));
              attempts++;
            }

            if (!window.cocoSsd) {
              throw new Error('COCO-SSD library failed to load from CDN');
            }

            // Load the COCO-SSD model
            const loaded = await window.cocoSsd.load({
              base: 'lite_mobilenet_v2',
            });
            return loaded;
          })();
        }

        const loadedModel = await modelLoadPromise;
        cachedModel = loadedModel;

        clearInterval(progressInterval);

        if (!cancelled) {
          setLoadProgress(92);
          await new Promise(r => setTimeout(r, 200));
          if (cancelled) return;
          setLoadProgress(97);
          await new Promise(r => setTimeout(r, 150));
          if (cancelled) return;
          setLoadProgress(100);
          await new Promise(r => setTimeout(r, 300));
          if (cancelled) return;

          setModel(loadedModel);
          setIsLoading(false);
        }
      } catch (err) {
        clearInterval(progressInterval);
        modelLoadPromise = null; // Allow retry on error
        if (!cancelled) {
          console.error('Failed to load COCO-SSD model:', err);
          setError(err.message || 'Failed to load AI model');
          setIsLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
    };
  }, []);

  return { model, isLoading, loadProgress, error };
}
