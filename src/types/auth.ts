import { UserRow } from './database';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    college?: string;
    department?: string;
    year?: number;
    avatar_url?: string;
  };
}

export interface SignUpInput {
  email: string;
  password?: string;
  name: string;
  college: string;
  department: string;
  year: number;
  bio?: string;
}

export interface SignInInput {
  email: string;
  password?: string;
}

export interface AuthSessionResult {
  user: UserRow | null;
  isAuthenticated: boolean;
  error?: string | null;
}
