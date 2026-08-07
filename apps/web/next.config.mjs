/** @type {import('next').NextConfig} */
const nextConfig = {
  // Portabilidad desde el día uno (§19): salida autónoma, no atada a Vercel.
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@dejatellevar/ui',
    '@dejatellevar/api',
    '@dejatellevar/core',
    '@dejatellevar/db',
    '@dejatellevar/contracts',
  ],
  experimental: {
    // postgres-js y drizzle corren solo en el servidor.
    serverComponentsExternalPackages: ['postgres', 'drizzle-orm'],
  },
};

export default nextConfig;
