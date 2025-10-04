import { useEffect, useCallback } from 'react';
import { useLayout } from '../contexts/LayoutContext';

export const useKeyboardShortcuts = () => {
  const { toggleSidebar, resetLayout } = useLayout();

  const handleKeyDown = useCallback((event) => {
    // Check for modifier keys
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    // Sidebar toggle: Ctrl/Cmd + B
    if (isCtrlOrCmd && event.key === 'b') {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    // Reset layout: Ctrl/Cmd + Shift + R
    if (isCtrlOrCmd && isShift && event.key === 'R') {
      event.preventDefault();
      resetLayout();
      return;
    }

    // Toggle fullscreen: F11
    if (event.key === 'F11') {
      event.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      return;
    }

    // Escape key to close modals/overlays
    if (event.key === 'Escape') {
      // This will be handled by individual components
      return;
    }
  }, [toggleSidebar, resetLayout]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // Expose functions for manual triggering
    toggleSidebar,
    resetLayout
  };
};

export default useKeyboardShortcuts;
