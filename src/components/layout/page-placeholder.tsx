import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Stage 1 route placeholder. Confirms navigation resolves to a real page while
 * the full build for each route lands in its scheduled stage.
 */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  stage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stage: string;
}) {
  return (
    <div className="container-oriel flex min-h-[52vh] flex-col justify-center py-20">
      <p className="t-eyebrow text-oriel-orange">{eyebrow}</p>
      <h1 className="t-h1 mt-2 max-w-3xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-body-lg text-oriel-slate">{description}</p>
      <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-pill bg-oriel-mist px-4 py-1.5 font-mono text-small text-oriel-slate">
        Scheduled for {stage}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit items-center gap-2 text-body font-semibold text-oriel-navy hover:text-oriel-orange"
      >
        <ArrowLeft size={18} strokeWidth={1.5} />
        Back to home
      </Link>
    </div>
  );
}
