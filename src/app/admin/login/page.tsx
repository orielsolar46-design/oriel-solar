import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { isAdminConfigured } from '@/lib/admin/session';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Staff sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

/**
 * Sign in sits on the deep navy the rest of the back office is framed in, so
 * the boundary between storefront and staff tooling is obvious from the first
 * screen. The sun arc is the only ornament — it is the brand's signature mark,
 * and the brief allows it in exactly five places.
 */
export default function AdminLoginPage() {
  const configured = isAdminConfigured();

  return (
    // Fixed, so this escapes the admin shell's rail offset and page padding.
    // The nav already hides itself on this route; this covers the rest.
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-oriel-navy-deep px-4 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="mb-7 flex items-center gap-3">
          <span className="h-9 w-1.5 rounded-pill bg-sun-arc" aria-hidden />
          <span>
            <span className="block font-headline text-[1.125rem] font-semibold leading-tight text-oriel-white">
              Oriel Solar
            </span>
            <span className="block text-[0.6875rem] uppercase tracking-[0.12em] text-oriel-white/50">
              Back office
            </span>
          </span>
        </div>

        <div className="rounded-card bg-oriel-white p-7 shadow-oriel-lift">
          <h1 className="font-headline text-[1.25rem] font-semibold tracking-tight text-oriel-navy">
            Staff sign in
          </h1>

          {configured ? (
            <>
              <p className="mt-1.5 text-small text-oriel-slate">
                Enter the staff passphrase to reach the dashboard.
              </p>
              <Suspense fallback={<div className="mt-5 h-32" />}>
                <LoginForm />
              </Suspense>
            </>
          ) : (
            <p className="mt-4 rounded-input border border-oriel-line bg-oriel-gold-soft p-3.5 text-small text-oriel-navy-ink">
              Staff access is not configured on this deployment. Set{' '}
              <span className="font-mono text-micro">ADMIN_STAFF_KEY</span> in the environment to
              enable it.
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-micro text-oriel-white/45">
          <Link href="/" className="transition-colors hover:text-oriel-white/80">
            Return to orielpower.com
          </Link>
        </p>
      </div>
    </div>
  );
}
