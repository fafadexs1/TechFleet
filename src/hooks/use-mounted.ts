
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to check if the component is mounted.
 * Useful to prevent hydration errors by only rendering
 * components on the client-side.
 * @returns {boolean} - True if the component is mounted, false otherwise.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
