/**
 * SkillSwap Backend Core — Public Module Exports
 */

// Types
export * from './types/database';
export * from './types/user';
export * from './types/skills';
export * from './types/auth';
export * from './types/requests';
export * from './types/offers';

// Validations
export * from './lib/validations/auth';
export * from './lib/validations/user';
export * from './lib/validations/skills';
export * from './lib/validations/requests';
export * from './lib/validations/offers';

// Database & Clients
export * from './lib/supabase/client';
export * from './lib/supabase/server';
export * from './lib/supabase/admin';

// Backend Services
export * from './lib/services/auth-service';
export * from './lib/services/user-service';
export * from './lib/services/skills-service';
export * from './lib/services/transaction-service';
export * from './lib/services/requests-service';
export * from './lib/services/offers-service';


