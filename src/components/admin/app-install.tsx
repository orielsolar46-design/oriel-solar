'use client';

import * as React from 'react';
import { Bell, BellRing, Check, Download, Share, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * "Get the app" — installing the back office and turning on order alerts.
 *
 * The owner runs the business from a phone and does not open a dashboard
 * hourly. The notification is the product: an order lands, the phone buzzes,
 * tapping it opens that order. This card is the two taps that make that true.
 *
 * It is honest about the platforms rather than pretending they are the same.
 * Android and desktop Chrome hand us a real install prompt. iOS never does —
 * Safari requires Share → Add to Home Screen by hand, and until that happens
 * iOS refuses web push entirely — so on iOS this shows the instruction instead
 * of a button that would do nothing.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function AppInstall({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>(
    'default'
  );
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isIos, setIsIos] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsIos(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        // iPadOS 13+ reports itself as a Mac; the touch points give it away.
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    setInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
    setPermission(
      'Notification' in window && 'serviceWorker' in navigator
        ? Notification.permission
        : 'unsupported'
    );

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* a failed registration must not break the dashboard */
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setInstallEvent(null);
  };

  const enableAlerts = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const granted = await Notification.requestPermission();
      setPermission(granted);
      if (granted !== 'granted') {
        setMessage('Notifications are blocked. Allow them for this site in the browser settings.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const res = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          label: navigator.userAgent.slice(0, 80),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Could not turn on notifications.');
        return;
      }
      setMessage('This phone will now buzz when an order arrives.');
    } catch (e) {
      setMessage((e as Error).message || 'Could not turn on notifications.');
    } finally {
      setBusy(false);
    }
  };

  const alertsOn = permission === 'granted';
  // Nothing left to offer: installed, alerts on. Stay out of the way.
  if (installed && alertsOn && !message) return null;

  return (
    <section className="rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-oriel-orange-soft text-oriel-orange-deep"
          aria-hidden
        >
          <Smartphone size={20} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <h2 className="font-headline text-[1.0625rem] font-semibold text-oriel-navy">
            Get the app on your phone
          </h2>
          <p className="mt-0.5 text-micro text-oriel-slate">
            Add it to your home screen and it will buzz the moment an order arrives.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {!installed &&
          (isIos ? (
            <p className="flex flex-1 items-center gap-2 rounded-input bg-oriel-mist px-4 py-3 text-micro text-oriel-navy-ink">
              <Share size={16} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
              Tap <strong className="font-semibold">Share</strong>, then{' '}
              <strong className="font-semibold">Add to Home Screen</strong>.
            </p>
          ) : (
            <button
              type="button"
              onClick={install}
              disabled={!installEvent}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-input bg-oriel-orange px-4 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:opacity-60"
            >
              <Download size={17} strokeWidth={1.5} aria-hidden />
              {installEvent ? 'Install the app' : 'Open in Chrome to install'}
            </button>
          ))}

        {installed && (
          <p className="flex flex-1 items-center gap-2 rounded-input bg-oriel-green-soft px-4 py-3 text-micro font-medium text-oriel-green-deep">
            <Check size={16} strokeWidth={2} aria-hidden /> Installed on this phone
          </p>
        )}

        {permission === 'unsupported' ? (
          <p className="flex-1 rounded-input bg-oriel-gold-soft px-4 py-3 text-micro text-oriel-navy-ink">
            This browser cannot do notifications.
          </p>
        ) : alertsOn ? (
          <p className="flex flex-1 items-center gap-2 rounded-input bg-oriel-green-soft px-4 py-3 text-micro font-medium text-oriel-green-deep">
            <BellRing size={16} strokeWidth={2} aria-hidden /> Order alerts are on
          </p>
        ) : (
          <button
            type="button"
            onClick={enableAlerts}
            disabled={busy || (isIos && !installed)}
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2 rounded-input border border-oriel-navy bg-oriel-white px-4 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            <Bell size={17} strokeWidth={1.5} aria-hidden />
            {busy ? 'Turning on…' : 'Turn on order alerts'}
          </button>
        )}
      </div>

      {isIos && !installed && (
        <p className="mt-2 text-micro text-oriel-slate">
          On an iPhone the alerts can only be switched on after the app is on the home screen.
        </p>
      )}

      {message && (
        <p className="mt-3 rounded-input bg-oriel-mist p-3 text-micro text-oriel-navy-ink">
          {message}
        </p>
      )}
    </section>
  );
}
