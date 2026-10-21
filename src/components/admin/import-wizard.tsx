'use client';

import * as React from 'react';
import { ArrowRight, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * Price import wizard (MASTERPLAN 13): upload → map columns → diff preview →
 * apply. Nothing changes until the client has seen exactly what would change.
 */

type Row = Record<string, string>;

type Result = {
  match: string;
  verdict: 'new' | 'changed' | 'unchanged' | 'skipped';
  name?: string;
  message?: string;
  oldCost?: number | null;
  newCost?: number | null;
  oldRetail?: number | null;
  newRetail?: number | null;
};

/** Minimal CSV parser handling quoted fields and embedded commas. */
function parseCsv(text: string): { headers: string[]; rows: Row[] } {
  const lines: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (field || row.length) {
        row.push(field);
        lines.push(row);
        row = [];
        field = '';
      }
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    lines.push(row);
  }

  const [headerRow, ...dataRows] = lines.filter((l) => l.some((c) => c.trim()));
  const headers = (headerRow ?? []).map((h) => h.trim());
  const rows = dataRows.map((line) => {
    const entry: Row = {};
    headers.forEach((h, i) => {
      entry[h] = (line[i] ?? '').trim();
    });
    return entry;
  });
  return { headers, rows };
}

export function ImportWizard() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [matchColumn, setMatchColumn] = React.useState('');
  const [costColumn, setCostColumn] = React.useState('');
  const [matchBy, setMatchBy] = React.useState<'model_code' | 'name'>('model_code');
  const [results, setResults] = React.useState<Result[] | null>(null);
  const [summary, setSummary] = React.useState<Record<string, number> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [applyNote, setApplyNote] = React.useState<string | null>(null);

  const onFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setError('That file has no readable rows.');
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      // Sensible guesses the user can override.
      setMatchColumn(
        parsed.headers.find((h) => /model|code|sku|item/i.test(h)) ?? parsed.headers[0]
      );
      setCostColumn(
        parsed.headers.find((h) => /dealer|cost|price/i.test(h)) ??
          parsed.headers[parsed.headers.length - 1]
      );
      setStep(2);
    } catch {
      setError('Could not read that file. Save it as CSV and try again.');
    }
  };

  const preview = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'preview',
          matchBy,
          rows: rows.map((r) => ({ match: r[matchColumn] ?? '', cost: r[costColumn] ?? '' })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Preview failed.');
        return;
      }
      setResults(data.results);
      setSummary(data.summary);
      setStep(3);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'apply',
          matchBy,
          rows: rows.map((r) => ({ match: r[matchColumn] ?? '', cost: r[costColumn] ?? '' })),
        }),
      });
      const data = await res.json();
      setApplyNote(data.error ?? 'Applied.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Steps */}
      <ol className="flex gap-2 text-small">
        {['Upload', 'Map columns', 'Review changes'].map((label, i) => (
          <li
            key={label}
            className={cn(
              'flex items-center gap-1.5 rounded-pill px-3 py-1 font-semibold',
              step === i + 1
                ? 'bg-oriel-navy text-oriel-white'
                : step > i + 1
                  ? 'bg-oriel-green-soft text-oriel-green-deep'
                  : 'bg-oriel-white text-oriel-slate'
            )}
          >
            <span className="font-mono">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-card bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink" aria-live="polite">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="rounded-card border border-dashed border-oriel-line bg-oriel-white p-8 text-center">
          <FileUp size={28} strokeWidth={1.5} className="mx-auto text-oriel-slate" aria-hidden />
          <p className="mt-3 text-small text-oriel-navy-ink">
            Upload a supplier price list as CSV.
          </p>
          <p className="mt-1 text-micro text-oriel-slate">
            Export the supplier&apos;s spreadsheet as CSV first. Nothing is changed until you
            approve the preview.
          </p>
          <label className="mt-4 inline-block cursor-pointer rounded-input bg-oriel-orange px-5 py-2.5 text-small font-semibold text-oriel-white hover:bg-oriel-orange-deep">
            Choose a CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-card border border-oriel-line bg-oriel-white p-5">
          <h2 className="t-h3">Which columns are which?</h2>
          <p className="mt-1 text-small text-oriel-slate">
            {rows.length} rows read from the file.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="imp-match" className="mb-1 block text-small font-medium text-oriel-navy-ink">
                Column identifying the product
              </label>
              <select
                id="imp-match"
                value={matchColumn}
                onChange={(e) => setMatchColumn(e.target.value)}
                className="h-11 w-full rounded-input border border-oriel-line px-2 text-small"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                {(
                  [
                    { id: 'model_code', label: 'Match on model code' },
                    { id: 'name', label: 'Match on name' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMatchBy(option.id)}
                    className={cn(
                      'rounded-pill px-3 py-1 text-micro font-semibold',
                      matchBy === option.id
                        ? 'bg-oriel-orange-soft text-oriel-navy'
                        : 'bg-oriel-mist text-oriel-slate'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="imp-cost" className="mb-1 block text-small font-medium text-oriel-navy-ink">
                Column with the dealer cost
              </label>
              <select
                id="imp-cost"
                value={costColumn}
                onChange={(e) => setCostColumn(e.target.value)}
                className="h-11 w-full rounded-input border border-oriel-line px-2 text-small"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sample so the mapping can be sanity-checked */}
          <div className="mt-4 overflow-x-auto rounded-input border border-oriel-line">
            <table className="w-full text-left text-caption">
              <thead className="bg-oriel-mist">
                <tr>
                  <th className="px-3 py-2 font-medium text-oriel-slate">Product</th>
                  <th className="px-3 py-2 font-medium text-oriel-slate">Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 4).map((r, i) => (
                  <tr key={i} className="border-t border-oriel-line">
                    <td className="px-3 py-2 text-oriel-navy-ink">{r[matchColumn]}</td>
                    <td className="px-3 py-2 font-mono text-oriel-navy-ink">{r[costColumn]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={preview} disabled={busy}>
              {busy ? 'Checking…' : 'Preview changes'}{' '}
              <ArrowRight size={16} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && results && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Price changed', value: summary.changed, tone: 'gold' },
              { label: 'Unchanged', value: summary.unchanged, tone: 'plain' },
              { label: 'New items', value: summary.new, tone: 'plain' },
              { label: 'Skipped', value: summary.skipped, tone: 'plain' },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  'rounded-card border p-3',
                  s.tone === 'gold'
                    ? 'border-oriel-gold bg-oriel-gold-soft'
                    : 'border-oriel-line bg-oriel-white'
                )}
              >
                <p className="text-[0.6875rem] uppercase tracking-wider text-oriel-slate">
                  {s.label}
                </p>
                <p className="mt-0.5 font-mono text-h3 font-medium text-oriel-navy-ink">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-card border border-oriel-line bg-oriel-white">
            <table className="w-full text-left text-small">
              <thead className="bg-oriel-mist">
                <tr>
                  <th className="px-3 py-2 font-medium text-oriel-slate">Product</th>
                  <th className="px-3 py-2 font-medium text-oriel-slate">Verdict</th>
                  <th className="px-3 py-2 text-right font-medium text-oriel-slate">Cost</th>
                  <th className="px-3 py-2 text-right font-medium text-oriel-slate">Retail</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 200).map((r, i) => (
                  <tr key={`${r.match}-${i}`} className="border-t border-oriel-line">
                    <td className="px-3 py-2">
                      <span className="block text-oriel-navy-ink">{r.name ?? r.match}</span>
                      {r.message && (
                        <span className="block text-micro text-oriel-slate">{r.message}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'rounded-pill px-2 py-0.5 text-[0.6875rem] font-semibold',
                          r.verdict === 'changed'
                            ? 'bg-oriel-gold-soft text-oriel-navy-ink'
                            : r.verdict === 'new'
                              ? 'bg-oriel-orange-soft text-oriel-navy'
                              : 'bg-oriel-mist text-oriel-slate'
                        )}
                      >
                        {r.verdict}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-caption">
                      {r.verdict === 'changed' ? (
                        <>
                          <span className="text-oriel-slate line-through">
                            {r.oldCost != null ? formatKes(r.oldCost) : '—'}
                          </span>{' '}
                          <span className="text-oriel-navy-ink">
                            {r.newCost != null ? formatKes(r.newCost) : '—'}
                          </span>
                        </>
                      ) : (
                        <span className="text-oriel-slate">
                          {r.newCost != null ? formatKes(r.newCost) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-caption">
                      {r.verdict === 'changed' && r.newRetail != null ? (
                        <>
                          <span className="text-oriel-slate line-through">
                            {r.oldRetail != null ? formatKes(r.oldRetail) : '—'}
                          </span>{' '}
                          <span className="font-medium text-oriel-navy-ink">
                            {formatKes(r.newRetail)}
                          </span>
                        </>
                      ) : (
                        <span className="text-oriel-slate">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {applyNote && (
            <p className="rounded-card bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink">
              {applyNote}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back to mapping
            </Button>
            <Button onClick={apply} disabled={busy || summary.changed + summary.new === 0}>
              Apply {summary.changed + summary.new} changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
