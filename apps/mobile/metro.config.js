// Configuración de Metro para monorepo pnpm: vigila la raíz del workspace y
// resuelve dependencias tanto locales como hoisteadas en la raíz.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm necesita el lookup jerárquico ACTIVO (para resolver deps anidadas en
// el store .pnpm), a diferencia de Yarn/npm. Solo ampliamos las rutas.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Los paquetes del workspace exponen su fuente vía el campo "exports"
// (p. ej. @dejatellevar/contracts → ./src/index.ts). Metro debe honrarlo.
config.resolver.unstable_enablePackageExports = true;

// Los paquetes del workspace están en TS-ESM: sus imports relativos llevan
// extensión .js (p. ej. `export * from './money.js'`). Metro no la reescribe
// a .ts, así que lo hacemos aquí, cayendo al original si no aplica.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    try {
      return context.resolveRequest(context, moduleName.replace(/\.js$/, ''), platform);
    } catch {
      // Cae al comportamiento por defecto si no existe la versión .ts/.tsx.
    }
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
