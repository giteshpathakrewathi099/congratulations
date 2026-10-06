'use client';

import Script from 'next/script';

const FIREBASE_APP =
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
const FIREBASE_DB =
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';

export default function LegacyScripts() {
  return (
    <>
      <Script src={FIREBASE_APP} strategy="beforeInteractive" />
      <Script src={FIREBASE_DB} strategy="beforeInteractive" />
    </>
  );
}
