'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-4">
      <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Something went wrong</p>
      <p className="text-sm text-neutral-500 max-w-xs">
        This page encountered an unexpected error. You can try reloading it.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
