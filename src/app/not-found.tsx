import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-oriel flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="t-eyebrow text-oriel-slate">Error 404</p>
      <h1 className="t-h1 mt-2">This page isn&apos;t here.</h1>
      <p className="mt-4 max-w-xl text-body-lg text-oriel-slate">
        The link may be broken or the page may have moved. Try the catalogue, or tell us what
        you need and we&apos;ll quote it.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/shop">
            Shop products
            <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/request-a-quote">
            <FileText size={18} strokeWidth={1.5} />
            Request a quote
          </Link>
        </Button>
      </div>
    </div>
  );
}
