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
export * from './types/swaps';
export * from './types/transactions';
export * from './types/ratings';

// Validations
export * from './lib/validations/auth';
export * from './lib/validations/user';
export * from './lib/validations/skills';
export * from './lib/validations/requests';
export * from './lib/validations/offers';
export * from './lib/validations/swaps';
export * from './lib/validations/transactions';
export * from './lib/validations/ratings';

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
export * from './lib/services/swaps-service';
export * from './lib/services/ratings-service';



