/**
 * Modern Enterprise Design Tokens
 * Based on reference images analysis for state-of-the-art UI/UX
 */

export const modernDesignTokens = {
  // Color System - Enterprise Grade
  colors: {
    // Primary Brand Colors - White/Light Grey Theme
    primary: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b'
    },
    
    // Secondary Colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    
    // Success Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    
    // Warning Colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },
    
    // Error Colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    },
    
    // Info Colors
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49'
    }
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    }
  },
  
  // Spacing Scale
  spacing: {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem'
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },
  
  // Animation Durations
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms'
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// Light Theme Configuration - White/Light Grey
export const lightTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f4f4f5',
    elevated: '#ffffff'
  },
  foreground: {
    primary: '#18181b',
    secondary: '#3f3f46',
    tertiary: '#71717a',
    disabled: '#a1a1aa'
  },
  border: {
    primary: '#e4e4e7',
    secondary: '#d4d4d8',
    focus: '#52525b'
  },
  surface: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f4f4f5',
    elevated: '#ffffff'
  }
};

// Dark Theme Configuration
export const darkTheme = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    elevated: '#1e293b'
  },
  foreground: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    disabled: '#64748b'
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
    focus: '#0ea5e9'
  },
  surface: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#475569',
    elevated: '#334155'
  }
};

// Component Variants
export const componentVariants = {
  button: {
    primary: {
      background: 'bg-primary-600 hover:bg-primary-700',
      text: 'text-white',
      border: 'border-transparent',
      shadow: 'shadow-sm hover:shadow-md'
    },
    secondary: {
      background: 'bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700',
      text: 'text-secondary-900 dark:text-secondary-100',
      border: 'border-secondary-200 dark:border-secondary-700',
      shadow: 'shadow-sm hover:shadow-md'
    },
    outline: {
      background: 'bg-transparent hover:bg-secondary-50 dark:hover:bg-secondary-800',
      text: 'text-secondary-700 dark:text-secondary-300',
      border: 'border-secondary-300 dark:border-secondary-600',
      shadow: 'shadow-sm hover:shadow-md'
    },
    ghost: {
      background: 'bg-transparent hover:bg-secondary-100 dark:hover:bg-secondary-800',
      text: 'text-secondary-700 dark:text-secondary-300',
      border: 'border-transparent',
      shadow: 'none'
    }
  },
  
  card: {
    default: {
      background: 'bg-white dark:bg-secondary-800',
      border: 'border-secondary-200 dark:border-secondary-700',
      shadow: 'shadow-sm',
      radius: 'rounded-lg'
    },
    elevated: {
      background: 'bg-white dark:bg-secondary-800',
      border: 'border-secondary-200 dark:border-secondary-700',
      shadow: 'shadow-lg',
      radius: 'rounded-xl'
    },
    flat: {
      background: 'bg-secondary-50 dark:bg-secondary-900',
      border: 'border-transparent',
      shadow: 'none',
      radius: 'rounded-lg'
    }
  },
  
  input: {
    default: {
      background: 'bg-white dark:bg-secondary-800',
      border: 'border-secondary-300 dark:border-secondary-600',
      focus: 'focus:border-primary-500 focus:ring-primary-500',
      text: 'text-secondary-900 dark:text-secondary-100'
    },
    error: {
      background: 'bg-white dark:bg-secondary-800',
      border: 'border-error-500',
      focus: 'focus:border-error-500 focus:ring-error-500',
      text: 'text-secondary-900 dark:text-secondary-100'
    }
  }
};

export default modernDesignTokens;
