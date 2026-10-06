'use client';

import { useEffect, useRef } from 'react';
import { CARD_PAGE_HTML } from '@/lib/legacyHtml';
import { loadLegacyScripts, runLegacyAppInit } from '@/lib/loadLegacyScripts';

export default function LegacyCardPage({ id }: { id: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.__CARD_ID__ = id;
    window.dispatchEvent(new Event('card-page-loading'));

    if (rootRef.current) {
      rootRef.current.innerHTML = CARD_PAGE_HTML;
      const wrapper = rootRef.current.querySelector('.celebration-wrapper') as HTMLElement | null;
      if (wrapper) wrapper.style.visibility = 'hidden';
    }

    loadLegacyScripts('card')
      .then(() => {
        window.__CARD_ID__ = id;
        runLegacyAppInit();
      })
      .catch((error) => {
        console.error(error);
        window.dispatchEvent(new Event('card-page-ready'));
      });
  }, [id]);

  return <div ref={rootRef} />;
}
