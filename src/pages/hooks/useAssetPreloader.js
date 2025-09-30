import { useEffect, useMemo, useRef, useState } from "react";
import audio from "../../lib/audio-manager";

function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ok: true, url });
    img.onerror = () => resolve({ ok: false, url });
    img.src = url;
  });
}

export default function useAssetPreloader({
  audioManifest = {},
  imageUrls = [],
} = {}) {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const countRef = useRef(0);

  const uniqueImages = useMemo(
    () => Array.from(new Set(imageUrls.filter(Boolean))),
    [imageUrls]
  );
  const audioEntries = useMemo(
    () => Object.entries(audioManifest),
    [audioManifest]
  );

  useEffect(() => {
    let cancelled = false;
    const totalItems = uniqueImages.length + audioEntries.length;
    setTotal(totalItems);
    setProgress(0);
    countRef.current = 0;
    setReady(false);
    setError(null);

    const bump = () => {
      countRef.current += 1;
      if (cancelled) return;
      setProgress(countRef.current);
      if (countRef.current >= totalItems) {
        setReady(true);
      }
    };

    const loadAll = async () => {
      try {
        // Start images
        const imgPromises = uniqueImages.map(
          () =>
            // bump on each image completion (success or error)
            null
        );
        uniqueImages.forEach((url, i) => {
          imgPromises[i] = preloadImage(url).then(bump);
        });

        // Start audio with progress callback
        const audioPromise = audio.load(audioManifest, {
          onProgress: () => bump(),
        });

        await Promise.all([audioPromise, Promise.all(imgPromises)]);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [uniqueImages, audioEntries]);

  return { ready, progress, total, error };
}
