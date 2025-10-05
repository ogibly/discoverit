import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const AppLogo = ({ className = '', size = 64, showText = true, ...props }) => {
  const { isDark } = useTheme();
  
  const logoSrc = isDark ? '/logo-dark.svg' : '/logo-light.svg';
  
  return (
    <div className={`flex items-center ${className}`} {...props}>
      <img 
        src={logoSrc} 
        alt="DiscoverIT Logo" 
        width={size} 
        height={size}
        className="flex-shrink-0"
      />
      {showText && (
        <div className="ml-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            DiscoverIT
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Network Management Platform
          </p>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
