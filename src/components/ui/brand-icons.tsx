/**
 * Brand marks for the third-party services Oriel actually points a customer at:
 * M-Pesa (payment), the delivery fleet, the Nairobi location pin, Gmail (email)
 * and WhatsApp.
 *
 * All of them are inline SVG rather than image files, so they scale to any
 * size, stay crisp on a high-density phone screen, carry no white box onto the
 * navy surfaces, cost no extra request, and can be tuned per surface.
 *
 * Two rules hold across the set:
 *
 * 1. No `<defs>`, gradients or `id` attributes. Several of these render inside
 *    server components and repeat many times on one page, where a fixed id
 *    would collide and `useId` is not available. Depth is built from flat
 *    fills instead.
 * 2. Every mark that lands on both the white/mist surfaces and the navy ones
 *    takes a `tone`. `light` is the artwork as drawn, `dark` lifts it for the
 *    navy, and `mono` drops to `currentColor` for the places that are really
 *    UI affordances and need to inherit an active/inactive state.
 */

type Tone = 'light' | 'dark' | 'mono';

type IconProps = {
  size?: number;
  className?: string;
  title?: string;
};

/* -------------------------------------------------------------------------- */
/*  M-Pesa                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * M-Pesa acceptance mark: the green "M" and "PESA" logotype with the handset
 * device and its red swoosh standing in for the hyphen.
 *
 * The letterforms are stroked centre-lines rather than filled outlines, which
 * keeps the weight uniform at every size and holds the shapes together down at
 * the 15–17px this is set at inline.
 *
 * Safaricom's green is #43B02A, which lands at 2.8:1 on white. A logotype is
 * exempt from the contrast rule, but this one sits inline in a sentence a buyer
 * has to read before parting with money, so the light tone darkens it to
 * #2F7D1D — clearing 4.5:1 on white and on the peach payment card while still
 * reading as M-Pesa green next to the red swoosh. On navy there is nothing to
 * fix: the true green reads at 6.7:1, so `dark` shows the authentic colour.
 */
export function MpesaMark({
  height = 16,
  tone = 'light',
  className,
}: {
  height?: number;
  /** Surface the mark sits on: `light` for white/mist, `dark` for the navy. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const green = tone === 'dark' ? '#43B02A' : '#2F7D1D';
  const red = tone === 'dark' ? '#FF3B30' : '#C4050F';
  const handset = tone === 'dark' ? '#E8F0E8' : '#D9E5DA';

  return (
    <svg
      height={height}
      width={height * (293 / 84)}
      viewBox="0 0 293 84"
      fill="none"
      className={className}
      role="img"
      aria-label="M-Pesa"
    >
      <title>M-Pesa</title>

      {/* Handset device, drawn first so the M's right leg crosses in front of
          its left edge exactly as it does in the Safaricom lockup. It stands
          taller than the cap height, as in the original. */}
      <rect x="64" y="0" width="40" height="84" rx="20" fill={handset} />
      {/* Screen band stays white on both tones — it is the contrast the red
          swoosh needs, and the handset colour already carries the surface. */}
      <rect x="64" y="28" width="40" height="30" fill="#FFFFFF" />
      <path
        d="M66,52 C67,41 75,32 87,32 C95,32 101,36 104,42 C97,38 88,39 80,45 C73,50 67,55 66,52 Z"
        fill={red}
      />

      <g
        transform="translate(0,12)"
        stroke={green}
        strokeWidth={14}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeMiterlimit={3}
      >
        {/* M */}
        <path d="M7,53 V7 L31,33 L55,7 V53" />
        {/* P */}
        <path d="M119,53 V7 H133 A11.5,11.5 0 0 1 133,30 H119" />
        {/* E */}
        <path d="M188,7 H164 V53 H188" />
        <path d="M164,30 H185" />
        {/* S */}
        <path d="M231,17 C231,11 225,7 219,7 C213,7 207,11 207,17 C207,23 212,27 219,30 C226,33 231,37 231,43 C231,49 225,53 219,53 C213,53 207,49 207,43" />
        {/* A */}
        <path d="M250,53 L268,7 L286,53" />
        <path d="M257.5,40 H278.5" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Delivery                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Delivery mark — the navy lorry with its blue motion swooshes.
 *
 * The supplied artwork is a three-quarter cab wrapped in a swoosh ring. That
 * detail turns to mush below about 40px, and this sits at 17–20px next to
 * "Nationwide delivery", so the silhouette is reduced to a side-on box lorry
 * with the three swooshes kept as the recognisable part of the identity.
 */
export function DeliveryIcon({
  size = 20,
  tone = 'light',
  className,
  title,
}: IconProps & { tone?: Tone }) {
  const body =
    tone === 'dark' ? '#FFFFFF' : tone === 'mono' ? 'currentColor' : '#232063';
  const swoosh =
    tone === 'dark' ? '#6FB2F0' : tone === 'mono' ? 'currentColor' : '#4A90D9';
  const glass =
    tone === 'dark' ? '#1B2A4A' : tone === 'mono' ? 'none' : '#FFFFFF';

  return (
    <svg
      width={size * (40 / 24)}
      height={size}
      viewBox="0 0 40 24"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}

      {/* Motion swooshes, longest in the middle as in the supplied logo. */}
      <g
        stroke={swoosh}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={tone === 'mono' ? 0.45 : 1}
      >
        <path d="M3.5,6.5 C5.5,5.3 7.5,5.1 9.5,5.6" />
        <path d="M1,12 C3.5,10.4 6.5,10.2 9.5,10.9" />
        <path d="M3.5,17.5 C5.5,16.3 7.5,16.1 9.5,16.6" />
      </g>

      {/* Box body and cab */}
      <path d="M11,4 H26 V17 H11 Z" fill={body} />
      <path d="M26,8 H31 L35,12 V17 H26 Z" fill={body} />
      {/* Windscreen */}
      <path d="M27.6,9.6 H30.4 L32.8,12 H27.6 Z" fill={glass} />

      {/* Wheels */}
      <circle cx="16" cy="18" r="3" fill={body} />
      <circle cx="31" cy="18" r="3" fill={body} />
      <circle cx="16" cy="18" r="1.1" fill={glass} />
      <circle cx="31" cy="18" r="1.1" fill={glass} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Location                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Location pin — the blue map marker with the white centre disc.
 *
 * The supplied artwork is a 3D render sitting on a map platter and carrying a
 * stock watermark, so only the marker itself is reproduced. The gloss is two
 * flat fills rather than a gradient, for the no-`id` rule above.
 */
export function LocationIcon({
  size = 18,
  tone = 'light',
  className,
  title,
}: IconProps & { tone?: Tone }) {
  const pin =
    tone === 'dark' ? '#4C9BE8' : tone === 'mono' ? 'currentColor' : '#2C7DD0';
  const gloss =
    tone === 'dark' ? '#7CBAF2' : tone === 'mono' ? 'currentColor' : '#4C9BE8';
  const disc =
    tone === 'dark' ? '#0B1B33' : tone === 'mono' ? 'none' : '#FFFFFF';

  return (
    <svg
      width={size * (24 / 30)}
      height={size}
      viewBox="0 0 24 30"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}

      <path
        d="M12,1 C6.6,1 2.2,5.4 2.2,10.8 C2.2,18.2 12,29 12,29 C12,29 21.8,18.2 21.8,10.8 C21.8,5.4 17.4,1 12,1 Z"
        fill={pin}
      />
      {/* Upper-left gloss, standing in for the render's specular highlight. */}
      {tone !== 'mono' && (
        <path
          d="M12,1 C6.6,1 2.2,5.4 2.2,10.8 C2.2,13.1 3.2,15.8 4.6,18.4 C3.9,15.9 3.6,13.5 3.9,11.2 C4.6,5.9 8.2,2.3 12,1 Z"
          fill={gloss}
        />
      )}
      <circle cx="12" cy="10.8" r="5.6" fill={disc} />
      {tone !== 'mono' && (
        <circle
          cx="12"
          cy="10.8"
          r="7.2"
          stroke="#FFFFFF"
          strokeWidth={0.7}
          opacity={0.55}
        />
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gmail                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Gmail mark — the rounded-capsule "M" in Google's four brand colours.
 *
 * Left stem blue, the V in red, the top-right cap yellow and the right stem
 * green, matching the supplied artwork. Drawn as round-capped strokes so the
 * capsule ends stay true at any size. Full colour on every surface: the four
 * hues all clear the navy as well as the white, so this one takes no tone.
 */
export function GmailIcon({ size = 16, className, title }: IconProps) {
  return (
    <svg
      width={size * (48 / 42)}
      height={size}
      viewBox="0 0 48 42"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <g strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7,11 V31" stroke="#4285F4" />
        <path d="M41,18 V31" stroke="#34A853" />
        <path d="M41,11 V18" stroke="#FBBC04" />
        <path d="M7,11 L24,30 L41,11" stroke="#EA4335" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

/** Official WhatsApp glyph. `currentColor` by default; pass brand green where the surface allows. */
export function WhatsAppIcon({ size = 20, className, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/**
 * WhatsApp glyph reversed out of its own green disc, matching the supplied
 * icon. One SVG rather than a styled span, so it keeps its colours wherever it
 * is dropped and never inherits a surrounding text colour by accident.
 */
export function WhatsAppBadge({ size = 24, className, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label={title ?? 'WhatsApp'}
    >
      <title>{title ?? 'WhatsApp'}</title>
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <g transform="translate(8.56 8.56) scale(0.62)" fill="#FFFFFF">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </g>
    </svg>
  );
}
