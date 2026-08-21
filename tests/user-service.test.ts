/**
 * Unit and Contract Tests for SkillSwap Users & Profiles Service
 * Built for Vitest
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { UserService } from '../src/lib/services/user-service';
import { validateUpdateUserProfileInput } from '../src/lib/validations/user';
import * as SupabaseClientModule from '../src/lib/supabase/client';

describe('Users & Profiles Backend Service', () => {
  const mockOwnerUser = {
    id: 'user-uuid-1111',
    name: 'Priya Sharma',
    email: 'priya@campus.edu',
    avatar_url: 'https://campus.edu/avatars/priya.png',
    college: 'Engineering Campus',
    department: 'Computer Science',
    year: 3,
    bio: 'React & Python enthusiast',
    credits_balance: 20,
    rating: 5.0,
    created_at: '2026-08-21T10:00:00Z',
  };

  const mockOtherUser = {
    id: 'user-uuid-2222',
    name: 'Aarav Patel',
    email: 'aarav@campus.edu',
    avatar_url: 'https://campus.edu/avatars/aarav.png',
    college: 'Engineering Campus',
    department: 'Information Technology',
    year: 2,
    bio: 'UI/UX and frontend developer',
    credits_balance: 35,
    rating: 4.8,
    created_at: '2026-08-21T11:00:00Z',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Server-Side Input Validation (validateUpdateUserProfileInput)', () => {
    it('should validate and accept correct profile update data', () => {
      const result = validateUpdateUserProfileInput({
        name: 'Priya S.',
        college: 'Engineering Campus',
        department: 'Computer Science',
        year: 4,
        bio: 'Updated bio for campus swaps',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Priya S.');
      expect(result.data?.year).toBe(4);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid year bounds (< 1 or > 8)', () => {
      const resultLow = validateUpdateUserProfileInput({ year: 0 });
      expect(resultLow.success).toBe(false);
      expect(resultLow.errors?.year).toBe('Year must be between 1 and 8.');

      const resultHigh = validateUpdateUserProfileInput({ year: 9 });
      expect(resultHigh.success).toBe(false);
      expect(resultHigh.errors?.year).toBe('Year must be between 1 and 8.');
    });

    it('should reject name shorter than 2 characters', () => {
      const result = validateUpdateUserProfileInput({ name: ' ' });
      expect(result.success).toBe(false);
      expect(result.errors?.name).toBe('Name must be at least 2 characters.');
    });
  });

  describe('2. Get Own Profile (UserService.getMyProfile)', () => {
    it('should return full profile with email and balance for the authenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockOwnerUser.id, email: mockOwnerUser.email } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: mockOwnerUser, error: null }),
            };
          }
          if (table === 'user_skills') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (table === 'swaps') {
            return {
              select: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
            };
          }
          return {};
        }),
      };

      vi.spyOn(SupabaseClientModule, 'getSupabaseBrowserClient').mockReturnValue(
        mockSupabase as any
      );

      const { profile, error } = await UserService.getMyProfile();

      expect(error).toBeNull();
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(mockOwnerUser.id);
      expect(profile?.email).toBe('priya@campus.edu');
      expect(profile?.credits_balance).toBe(20);
      expect(profile?.completed_swaps_count).toBe(2);
    });

    it('should return unauthorized error when no active session exists', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      };

      vi.spyOn(SupabaseClientModule, 'getSupabaseBrowserClient').mockReturnValue(
        mockSupabase as any
      );

      const { profile, error } = await UserService.getMyProfile();

      expect(profile).toBeNull();
      expect(error).toContain('Unauthorized');
    });
  });

  describe("3. Get Another User's Public Profile (UserService.getPublicProfile)", () => {
    it('should return sanitized public profile without exposing email', async () => {
      const publicSelectData = {
        id: mockOtherUser.id,
        name: mockOtherUser.name,
        avatar_url: mockOtherUser.avatar_url,
        college: mockOtherUser.college,
        department: mockOtherUser.department,
        year: mockOtherUser.year,
        bio: mockOtherUser.bio,
        rating: mockOtherUser.rating,
        created_at: mockOtherUser.created_at,
      };

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn((columns: string) => {
                // Ensure email is not in the select query
                expect(columns).not.toContain('email');
                expect(columns).not.toContain('credits_balance');
                return {
                  eq: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({ data: publicSelectData, error: null }),
                };
              }),
            };
          }
          if (table === 'user_skills') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (table === 'swaps') {
            return {
              select: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
            };
          }
          return {};
        }),
      };

      vi.spyOn(SupabaseClientModule, 'getSupabaseBrowserClient').mockReturnValue(
        mockSupabase as any
      );

      const { profile, error } = await UserService.getPublicProfile(mockOtherUser.id);

      expect(error).toBeNull();
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(mockOtherUser.id);
      expect(profile?.name).toBe('Aarav Patel');
      expect((profile as unknown as Record<string, unknown>).email).toBeUndefined();
      expect((profile as unknown as Record<string, unknown>).credits_balance).toBeUndefined();
    });
  });

  describe('4. Update Own Profile (UserService.updateMyProfile)', () => {
    it('should update profile using session user ID', async () => {
      const updatedUser = { ...mockOwnerUser, bio: 'Updated bio text', year: 4 };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockOwnerUser.id } },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn((col: string, val: string) => {
            expect(col).toBe('id');
            expect(val).toBe(mockOwnerUser.id);
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: updatedUser, error: null }),
            };
          }),
        })),
      };

      vi.spyOn(SupabaseClientModule, 'getSupabaseBrowserClient').mockReturnValue(
        mockSupabase as any
      );

      const { user, error } = await UserService.updateMyProfile({
        bio: 'Updated bio text',
        year: 4,
      });

      expect(error).toBeNull();
      expect(user?.bio).toBe('Updated bio text');
      expect(user?.year).toBe(4);
    });
  });

  describe("5. Security Enforcement on Profile Updates (UserService.updateUserProfile)", () => {
    it("should reject attempt to update another user's profile with Forbidden error", async () => {
      const attackerSession = { id: 'attacker-uuid-9999' };
      const victimUserId = mockOwnerUser.id;

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: attackerSession },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      vi.spyOn(SupabaseClientModule, 'getSupabaseBrowserClient').mockReturnValue(
        mockSupabase as any
      );

      const { user, error } = await UserService.updateUserProfile(victimUserId, {
        name: 'Hacked Name',
      });

      expect(user).toBeNull();
      expect(error).toContain('Forbidden');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
