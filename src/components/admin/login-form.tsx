'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passphrase, setPassphrase] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Sign in failed.');
        setBusy(false);
        return;
      }
      router.push(params.get('next') ?? '/admin');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="passphrase" className="mb-1 block text-small font-medium text-oriel-navy-ink">
          Staff passphrase
        </label>
        <input
          id="passphrase"
          type="password"
          autoComplete="current-password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="h-11 w-full rounded-input border border-oriel-line px-3 text-body text-oriel-navy-ink focus:border-oriel-navy focus:outline-none"
        />
      </div>
      {error && (
        <p className="rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink" aria-live="polite">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
