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
    '@dejatellevar/client',
  ],
  // postgres-js y drizzle corren solo en el servidor (Next 15: clave de nivel superior).
  serverExternalPackages: ['postgres', 'drizzle-orm'],
  webpack: (config) => {
    // Los paquetes del workspace usan imports ESM con extensión '.js' que apuntan
    // a archivos '.ts'. Webpack no resuelve eso por defecto: se lo enseñamos.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
};

export default nextConfig;
