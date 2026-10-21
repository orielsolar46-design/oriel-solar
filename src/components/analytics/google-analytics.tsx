import Script from 'next/script';

/**
 * Google Analytics 4.
 *
 * Renders nothing at all unless NEXT_PUBLIC_GA4_MEASUREMENT_ID is set, so
 * development, previews and any deployment without the measurement ID stay
 * completely free of tracking — no stray requests, no cookies, no console
 * noise, and no analytics data polluted by our own test traffic.
 *
 * Both tags load with `lazyOnload`, which waits for the window load event and
 * then browser idle time, so analytics never competes with the page itself.
 * Measured on the live domain, `afterInteractive` roughly doubled total
 * blocking time (600ms to 1,310ms on the test machine) for a script that
 * sells nothing. The brief requires a Lighthouse performance score of at
 * least 90 on a mid-range Android, which is exactly the hardware most Kenyan
 * buyers use, and on a shop a slow page costs orders as well as ranking.
 *
 * The trade-off, stated plainly: a visitor who leaves before the browser goes
 * idle is not counted. That is a small share of sessions, and it is the right
 * side of the trade — the alternative is slowing every buyer down to measure
 * the ones who left.
 *
 * GA4 anonymises IP addresses by default, so no flag is passed for it, and
 * page views on client-side navigations are handled by GA4's own enhanced
 * measurement rather than a route listener of ours.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
