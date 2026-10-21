import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The Oriel Power logo. Uses the client's supplied artwork.
 * `height` controls the rendered size; width scales with the artwork ratio.
 */
export function Logo({
  // The artwork is a full lockup — the mark plus "ORIEL POWER LTD" set small
  // beneath it. At 44px the wordmark was below the size that text stays
  // legible at, so the client's own name was unreadable in his own header.
  // The bar has the room; this uses it.
  height = 56,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  // Supplied artwork is ~ 16:9.
  const width = Math.round(height * 1.78);
  return (
    <Link
      href="/"
      className={cn('inline-flex items-center', className)}
      aria-label="Oriel Power Ltd — home"
    >
      <Image
        src="/brand/oriel-logo.jpg"
        alt="Oriel Power Ltd"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto"
        style={{ height, width: 'auto' }}
      />
    </Link>
  );
}
