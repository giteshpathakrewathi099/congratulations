'use client';

import { useEffect, useRef } from 'react';
import { CREATE_PAGE_HTML } from '@/lib/legacyHtml';
import { loadLegacyScripts, runLegacyAppInit } from '@/lib/loadLegacyScripts';

export default function LegacyCreatePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.__CARD_ID__ = null;

    if (rootRef.current) {
      rootRef.current.innerHTML = CREATE_PAGE_HTML;
    }

    loadLegacyScripts('create')
      .then(() => {
        window.__CARD_ID__ = null;
        runLegacyAppInit();
      })
      .catch(console.error);
  }, []);

  return <div ref={rootRef} />;
}
