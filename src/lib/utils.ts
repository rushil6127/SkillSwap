import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format SkillCredits display according to design guidelines (e.g. "◎ 20 SkillCredits")
 */
export function formatCredits(amount: number): string {
  return `◎ ${amount} SkillCredits`;
}
