'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The bar that saves a task screen.
 *
 * It does not exist until something has actually changed, which is the whole
 * safety model of the quick-edit screens: nothing typed on them is written
 * until it is committed here, and a screen with nothing pending looks exactly
 * like a screen that has just been saved.
 *
 * It is pinned to the bottom because these screens are used one-handed in a
 * store room, and on those routes the seven-column navigation bar is
 * suppressed so this owns the thumb zone. On desktop it clears the 256px rail
 * rather than sliding underneath it.
 */
export function CommitBar({
  changeCount,
  summary,
  onCommit,
  onDiscard,
  saving = false,
  disabled = false,
}: {
  changeCount: number;
  summary: React.ReactNode;
  onCommit: () => void;
  onDiscard?: () => void;
  saving?: boolean;
  disabled?: boolean;
}) {
  if (changeCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-oriel-line bg-oriel-white px-4 py-4 shadow-oriel-lift pb-[max(1rem,env(safe-area-inset-bottom))] lg:left-64 lg:px-10">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow font-semibold uppercase text-oriel-orange-deep">
            {changeCount} {changeCount === 1 ? 'change' : 'changes'}
          </p>
          <p className="mt-1 truncate font-mono text-micro text-oriel-navy-ink">{summary}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="hidden text-small text-oriel-slate transition-colors hover:text-oriel-navy disabled:opacity-50 sm:block"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={onCommit}
            disabled={saving || disabled}
            className={cn(
              'flex h-14 items-center justify-center gap-2 rounded-input bg-oriel-orange px-6 font-headline text-body-lg font-semibold text-oriel-white transition-colors',
              'hover:bg-oriel-orange-deep disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {saving && <Loader2 size={18} className="animate-spin" aria-hidden />}
            {saving ? 'Committing…' : 'Commit change'}
          </button>
        </div>
      </div>
    </div>
  );
}
