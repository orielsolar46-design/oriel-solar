'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Keeps the chats list current without a websocket: a quiet refresh every
 * fifteen seconds while the page is visible. The server component does the
 * reading, so there is only one source of truth for the transcript format.
 */
export function ChatRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const timer = window.setInterval(tick, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [router, seconds]);

  return null;
}
