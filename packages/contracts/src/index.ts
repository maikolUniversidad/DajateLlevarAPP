export * from './money.js';
export * from './fidelity.js';
export * from './accessibility.js';
export * from './common.js';
export * from './enums.js';
export * from './service.js';
export * from './payment.js';
export * from './creator.js';
export * from './campaign.js';
export * from './auth.js';
export * from './admin.js';
export * from './preferences.js';

// Desambiguación: RegisterCreator(Schema) es canónico en creator.js (versión rica
// con enlaces sociales y consentimiento de IA). El re-export explícito hace que
// gane sobre cualquier definición homónima re-exportada con `export *`.
export { RegisterCreatorSchema, type RegisterCreator } from './creator.js';
