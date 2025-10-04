import React, { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './ui/Badge';
import { cn } from '../../utils/cn';
import { 
  Settings, 
  RotateCcw, 
  Sidebar, 
  Maximize2, 
  Minimize2,
  Keyboard,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

const LayoutPreferences = ({ className = '', ...props }) => {
  const { 
    sidebarCollapsed, 
    sidebarWidth, 
    layoutPreferences,
    toggleSidebar, 
    setSidebarState,
    updateLayoutPreference,
    resetLayout 
  } = useLayout();

  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts = [
    { key: 'Ctrl/Cmd + B', description: 'Toggle sidebar' },
    { key: 'Ctrl/Cmd + Shift + R', description: 'Reset layout' },
    { key: 'F11', description: 'Toggle fullscreen' },
    { key: 'Esc', description: 'Close modals/overlays' }
  ];

  const handleSidebarWidthChange = (newWidth) => {
    setSidebarState(sidebarCollapsed, newWidth);
  };

  const handleLayoutPreset = (preset) => {
    switch (preset) {
      case 'desktop':
        setSidebarState(false, 300);
        updateLayoutPreference('layoutPreset', 'desktop');
        break;
      case 'tablet':
        setSidebarState(true, 64);
        updateLayoutPreference('layoutPreset', 'tablet');
        break;
      case 'mobile':
        setSidebarState(true, 64);
        updateLayoutPreference('layoutPreset', 'mobile');
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('space-y-4', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Layout Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sidebar Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sidebar className="w-4 h-4" />
                <span className="text-sm font-medium">Sidebar</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={sidebarCollapsed ? 'secondary' : 'default'}>
                  {sidebarCollapsed ? 'Collapsed' : 'Expanded'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSidebar}
                >
                  {sidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {!sidebarCollapsed && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Sidebar Width: {sidebarWidth}px
                </label>
                <input
                  type="range"
                  min="200"
                  max="400"
                  value={sidebarWidth}
                  onChange={(e) => handleSidebarWidthChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Layout Presets */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-medium">Layout Presets</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLayoutPreset('desktop')}
                className="flex items-center space-x-1"
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLayoutPreset('tablet')}
                className="flex items-center space-x-1"
              >
                <Tablet className="w-3 h-3" />
                <span>Tablet</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLayoutPreset('mobile')}
                className="flex items-center space-x-1"
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </Button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Keyboard className="w-4 h-4" />
                <span className="text-sm font-medium">Keyboard Shortcuts</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcuts(!showShortcuts)}
              >
                {showShortcuts ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showShortcuts && (
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset Layout */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
              className="w-full flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Layout</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutPreferences;
