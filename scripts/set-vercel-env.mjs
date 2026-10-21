/**
 * Pushes the environment variables from .env.local into a Vercel project.
 *
 *   vercel login          # once
 *   vercel link           # once, to associate this folder with the project
 *   node scripts/set-vercel-env.mjs            # preview what will be set
 *   node scripts/set-vercel-env.mjs --apply    # actually set them
 *
 * Why a script: eleven variables typed by hand — one of them a 200-character
 * JWT — is how a production deployment ends up with a truncated key and a
 * confusing outage. Values are read from .env.local and never printed in full.
 *
 * Values marked DEV_ONLY are deliberately NOT sent: they are development
 * placeholders that must be replaced with real production values.
 */
import { readFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';

const env = Object.fromEntries(
  readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

/** name -> { required, devOnly, note } */
const SPEC = {
  NEXT_PUBLIC_SITE_URL: {
    required: true,
    devOnly: true,
    note: 'Must be the LIVE origin, not localhost. Set this manually.',
  },
  NEXT_PUBLIC_SUPABASE_URL: { required: true },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true },
  SUPABASE_SERVICE_ROLE_KEY: { required: true, note: 'Server-only. Bypasses RLS.' },
  RETAIL_MARKUP_PERCENT: {
    required: true,
    note: 'Confirmed by the client 2026-08-01: dealer x 1.20.',
  },
  ADMIN_STAFF_KEY: {
    required: true,
    devOnly: true,
    note: 'The dev value is not a secret. Set a strong passphrase manually.',
  },
  MPESA_CONSUMER_KEY: { required: false },
  MPESA_CONSUMER_SECRET: { required: false },
  MPESA_SHORTCODE: { required: false },
  MPESA_PASSKEY: { required: false },
  MPESA_ENVIRONMENT: { required: false },
  MPESA_CALLBACK_URL: { required: false },
  RESEND_API_KEY: { required: false },
  ORDER_NOTIFICATION_EMAIL: { required: false },
  AFRICASTALKING_API_KEY: { required: false },
  AFRICASTALKING_USERNAME: { required: false },
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: { required: false },
};

const apply = process.argv.includes('--apply');
const mask = (v) => (v.length > 12 ? `${v.slice(0, 6)}…${v.slice(-4)} (${v.length} chars)` : v);

const toSet = [];
const toSkip = [];
const missing = [];

for (const [name, spec] of Object.entries(SPEC)) {
  const value = env[name];
  if (!value) {
    if (spec.required) missing.push(name);
    continue;
  }
  if (spec.devOnly) toSkip.push({ name, value, note: spec.note });
  else toSet.push({ name, value, note: spec.note });
}

console.log(`\n${apply ? 'SETTING' : 'WOULD SET'} on Vercel (Production, Preview, Development):\n`);
for (const { name, value, note } of toSet) {
  console.log(`  ${name.padEnd(32)} ${mask(value)}${note ? `\n      ${note}` : ''}`);
}

if (toSkip.length) {
  console.log('\nDELIBERATELY SKIPPED — set these by hand in the Vercel dashboard:\n');
  for (const { name, note } of toSkip) console.log(`  ${name.padEnd(32)} ${note}`);
}

if (missing.length) {
  console.log('\nMISSING from .env.local (required):', missing.join(', '));
}

if (!apply) {
  console.log('\nNothing was changed. Re-run with --apply to set them.\n');
  process.exit(0);
}

console.log('');
for (const { name, value } of toSet) {
  for (const target of ['production', 'preview', 'development']) {
    try {
      // NOT piped on stdin. `vercel env add` accepted a piped value on
      // Windows and then stored an empty string — three variables that
      // existed, listed fine, and held nothing. --value is explicit, and the
      // verification pass below reads the values back rather than trusting
      // the exit code.
      execFileSync(
        'npx',
        ['vercel', 'env', 'add', name, target, '--value', value, '--yes', '--force'],
        { stdio: ['ignore', 'pipe', 'pipe'], shell: true }
      );
      console.log(`  set ${name} (${target})`);
    } catch (e) {
      const msg = String(e.stderr ?? e.message);
      console.log(
        `  ${msg.includes('already exists') ? 'exists' : 'FAILED'} ${name} (${target})` +
          (msg.includes('already exists') ? '' : ` — ${msg.trim().split('\n')[0]}`)
      );
    }
  }
}

// Read the values back. An env var that exists but is empty deploys happily
// and breaks at runtime, which is exactly what a silent stdin failure looks
// like — so this checks content, not just presence.
console.log('\nVerifying what production will actually see…');
try {
  const tmp = path.join(process.cwd(), '.vercel', '.env-verify');
  execFileSync('npx', ['vercel', 'env', 'pull', tmp, '--environment=production', '--yes'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });
  const pulled = Object.fromEntries(
    readFileSync(tmp, 'utf8')
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
  unlinkSync(tmp);
  for (const { name } of toSet) {
    const got = pulled[name];
    const ok = got != null && got.length > 0;
    console.log(`  ${ok ? 'ok    ' : 'EMPTY '} ${name}${ok ? ` (${got.length} chars)` : ''}`);
  }
} catch (e) {
  console.log(`  could not verify: ${String(e.message).split('\n')[0]}`);
}

console.log('\nDone. Now set the skipped variables by hand, then redeploy.\n');
