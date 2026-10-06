'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CardLoaderOverlay() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const onLoading = () => setVisible(true);
    const onReady = () => setVisible(false);

    window.addEventListener('card-page-loading', onLoading);
    window.addEventListener('card-page-ready', onReady);

    return () => {
      window.removeEventListener('card-page-loading', onLoading);
      window.removeEventListener('card-page-ready', onReady);
    };
  }, []);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="card-page-loader" aria-live="polite" aria-busy="true">
      <div className="card-page-loader-spinner" />
    </div>,
    document.body
  );
}
