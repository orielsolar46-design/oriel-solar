/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Product photographs uploaded through the admin live in Supabase Storage.
    // Without this, next/image refuses the host and every uploaded product
    // renders broken — the failure is at request time, not build time, so it
    // would not have shown up until someone actually added a product.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  experimental: {
    // lucide-react is a barrel export: without this, importing four icons can
    // pull the whole set into the shared chunk. This rewrites those imports to
    // direct paths so only the icons actually used are bundled.
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      {
        // www serves the whole site as well as the apex, so without this the
        // catalogue exists twice at two hostnames. Canonicals already point at
        // the apex, but a canonical is a hint and a redirect is not: this
        // makes www a single hop to the real address and keeps every link and
        // every share pointing at one host.
        source: '/:path*',
        has: [{ type: 'host', value: 'www.orielpower.com' }],
        destination: 'https://orielpower.com/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Generated product imagery is content-addressed by path and never
        // mutates in place, so it can be cached hard.
        source: '/products/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
