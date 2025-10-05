/**
 * Animation Utilities
 * Comprehensive animation system for smooth micro-interactions
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Animation variants
export const animationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  scaleInUp: {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -20 }
  },

  // Slide animations
  slideInUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' }
  },
  slideInDown: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' }
  },
  slideInLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' }
  },
  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' }
  },

  // Stagger animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }
};

// Animation presets
export const animationPresets = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Modal animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  modalContent: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },

  // Card animations
  cardHover: {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  cardTap: {
    tap: { scale: 0.98 },
    transition: { duration: 0.1 }
  },

  // Button animations
  buttonHover: {
    hover: { scale: 1.05 },
    transition: { duration: 0.2 }
  },
  buttonTap: {
    tap: { scale: 0.95 },
    transition: { duration: 0.1 }
  },

  // Loading animations
  loadingPulse: {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  loadingSpin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  },

  // Success animations
  successCheck: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },

  // Error animations
  errorShake: {
    animate: {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    }
  }
};

// Custom hooks for animations
export const useAnimation = (variant, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, ...options.observer }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [options.observer]);

  return {
    ref: elementRef,
    isVisible,
    variants: animationVariants[variant] || animationVariants.fadeIn,
    ...options
  };
};

// Stagger animation hook
export const useStaggerAnimation = (items, delay = 0.1) => {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleItems(items.length);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [items.length, delay]);

  return {
    container: animationVariants.staggerContainer,
    items: items.map((_, index) => ({
      ...animationVariants.staggerItem,
      transition: {
        ...animationVariants.staggerItem.transition,
        delay: index * delay
      }
    }))
  };
};

// Parallax animation hook
export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return {
    ref: elementRef,
    style: { transform: `translateY(${offset}px)` }
  };
};

// Magnetic effect hook
export const useMagneticEffect = (strength = 0.3) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      
      setPosition({ x: deltaX, y: deltaY });
    }
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [handleMouseMove, handleMouseLeave]);

  return {
    ref: elementRef,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: 'transform 0.1s ease-out'
    }
  };
};

// Ripple effect hook
export const useRippleEffect = () => {
  const [ripples, setRipples] = useState([]);
  const elementRef = useRef(null);

  const createRipple = useCallback((e) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const ripple = {
        id: Date.now(),
        x,
        y,
        size
      };
      
      setRipples(prev => [...prev, ripple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id));
      }, 600);
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      element.addEventListener('click', createRipple);
      return () => element.removeEventListener('click', createRipple);
    }
  }, [createRipple]);

  return {
    ref: elementRef,
    ripples
  };
};

// Tailwind CSS animation utilities
export const getAnimationClasses = (variant, options = {}) => {
  const baseClasses = 'transition-all ease-out';
  
  const variantClasses = {
    fadeIn: 'opacity-0 animate-fade-in',
    fadeInUp: 'opacity-0 translate-y-4 animate-fade-in-up',
    fadeInDown: 'opacity-0 -translate-y-4 animate-fade-in-down',
    fadeInLeft: 'opacity-0 -translate-x-4 animate-fade-in-left',
    fadeInRight: 'opacity-0 translate-x-4 animate-fade-in-right',
    scaleIn: 'opacity-0 scale-95 animate-scale-in',
    slideInUp: 'translate-y-full animate-slide-in-up',
    slideInDown: '-translate-y-full animate-slide-in-down',
    slideInLeft: '-translate-x-full animate-slide-in-left',
    slideInRight: 'translate-x-full animate-slide-in-right'
  };

  const durationClasses = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500'
  };

  const easingClasses = {
    ease: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    linear: 'linear'
  };

  return [
    baseClasses,
    variantClasses[variant] || variantClasses.fadeIn,
    durationClasses[options.duration] || durationClasses.normal,
    easingClasses[options.easing] || easingClasses.ease
  ].join(' ');
};

// Animation context for global settings
export const AnimationContext = React.createContext({
  reducedMotion: false,
  duration: 'normal',
  easing: 'ease'
});

export default {
  animationVariants,
  animationPresets,
  useAnimation,
  useStaggerAnimation,
  useParallax,
  useMagneticEffect,
  useRippleEffect,
  getAnimationClasses,
  AnimationContext
};
