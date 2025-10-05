/**
 * Tailwind CSS Utilities
 * Utility functions that leverage Tailwind CSS classes and design tokens
 */

import { cn } from './cn';

// Color utilities using Tailwind CSS classes
export const colorUtils = {
  // Primary colors
  primary: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-600',
    focus: 'focus:ring-yellow-500/20',
  },
  
  // Secondary colors
  secondary: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    hover: 'hover:bg-orange-600',
    focus: 'focus:ring-orange-500/20',
  },
  
  // Semantic colors
  success: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    hover: 'hover:bg-green-600',
    focus: 'focus:ring-green-500/20',
  },
  
  warning: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-600',
    focus: 'focus:ring-yellow-500/20',
  },
  
  error: {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    hover: 'hover:bg-red-600',
    focus: 'focus:ring-red-500/20',
  },
  
  info: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    hover: 'hover:bg-blue-600',
    focus: 'focus:ring-blue-500/20',
  },
};

// Background utilities
export const backgroundUtils = {
  primary: 'bg-slate-900',
  secondary: 'bg-slate-800',
  tertiary: 'bg-slate-700',
  elevated: 'bg-slate-600',
  card: 'bg-slate-800/50',
  glass: 'bg-slate-800/30 backdrop-blur-sm',
  gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
};

// Text utilities
export const textUtils = {
  primary: 'text-white',
  secondary: 'text-slate-200',
  muted: 'text-slate-400',
  disabled: 'text-slate-500',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

// Border utilities
export const borderUtils = {
  primary: 'border-slate-700',
  secondary: 'border-slate-600',
  focus: 'border-yellow-500',
  success: 'border-green-500',
  warning: 'border-yellow-500',
  error: 'border-red-500',
  info: 'border-blue-500',
};

// Spacing utilities
export const spacingUtils = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
};

// Animation utilities
export const animationUtils = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  scaleIn: 'animate-scale-in',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  shake: 'animate-shake',
  shimmer: 'animate-shimmer',
};

// Transition utilities
export const transitionUtils = {
  fast: 'transition-all duration-200',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
};

// Focus utilities
export const focusUtils = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
  ringPrimary: 'focus:ring-yellow-500/20',
  ringSecondary: 'focus:ring-orange-500/20',
  ringSuccess: 'focus:ring-green-500/20',
  ringWarning: 'focus:ring-yellow-500/20',
  ringError: 'focus:ring-red-500/20',
  ringInfo: 'focus:ring-blue-500/20',
};

// Hover utilities
export const hoverUtils = {
  scale: 'hover:scale-105',
  scaleDown: 'hover:scale-95',
  brightness: 'hover:brightness-110',
  opacity: 'hover:opacity-80',
  shadow: 'hover:shadow-lg',
  shadowXl: 'hover:shadow-xl',
  glow: 'hover:shadow-glow',
};

// Component utilities
export const componentUtils = {
  // Button variants
  button: {
    primary: cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
      'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
      'text-slate-900 font-semibold px-4 py-2',
      'focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105'
    ),
    secondary: cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
      'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 px-4 py-2',
      'focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    outline: cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
      'border border-slate-600 text-slate-300 hover:bg-slate-700/50 px-4 py-2',
      'focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    ghost: cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg',
      'text-slate-300 hover:bg-slate-700/50 px-4 py-2',
      'focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:ring-offset-2 focus:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
  },
  
  // Input variants
  input: cn(
    'w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg',
    'text-white placeholder-slate-400',
    'focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 focus:outline-none',
    'transition-all duration-200'
  ),
  
  // Card variants
  card: cn(
    'bg-slate-800/50 rounded-2xl border border-slate-700 shadow-lg',
    'hover:shadow-xl transition-all duration-300'
  ),
  
  // Badge variants
  badge: {
    default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};

// Layout utilities
export const layoutUtils = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 sm:py-16 lg:py-20',
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-1 md:grid-cols-2',
    cols3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
  },
};

// Responsive utilities
export const responsiveUtils = {
  hide: {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
  },
  show: {
    sm: 'block sm:hidden',
    md: 'block md:hidden',
    lg: 'block lg:hidden',
    xl: 'block xl:hidden',
  },
};

// Accessibility utilities
export const accessibilityUtils = {
  srOnly: 'sr-only',
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/20',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-500 focus:text-slate-900 focus:rounded-lg focus:font-semibold',
};

// Utility function to combine classes
export const combineClasses = (...classes) => {
  return cn(...classes.filter(Boolean));
};

// Utility function to create variant classes
export const createVariantClasses = (baseClasses, variants, variant) => {
  return cn(baseClasses, variants[variant]);
};

// Utility function to create responsive classes
export const createResponsiveClasses = (baseClasses, responsiveClasses) => {
  return cn(baseClasses, responsiveClasses);
};

export default {
  colorUtils,
  backgroundUtils,
  textUtils,
  borderUtils,
  spacingUtils,
  animationUtils,
  transitionUtils,
  focusUtils,
  hoverUtils,
  componentUtils,
  layoutUtils,
  responsiveUtils,
  accessibilityUtils,
  combineClasses,
  createVariantClasses,
  createResponsiveClasses,
};
