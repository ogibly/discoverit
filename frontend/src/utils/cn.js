import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 * Uses clsx for conditional classes and tailwind-merge for Tailwind-specific merging
 * 
 * @param {...(string | object | Array)} inputs - Class names or conditional objects
 * @returns {string} Merged class string
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-2 is overridden by px-4)
 * cn('bg-red-500', { 'bg-blue-500': isActive }) // Returns 'bg-blue-500' if isActive is true
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
