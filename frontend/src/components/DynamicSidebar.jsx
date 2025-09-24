import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';
import SidebarScanTracker from './SidebarScanTracker';
import ThemeToggle from './ThemeToggle';
import { 
  Search, 
  Settings, 
  User, 
  LogOut, 
  ChevronDown, 
  ChevronRight,
  Star,
  Clock,
  Zap,
  Activity,
  Home,
  Search as SearchIcon,
  Building,
  Monitor,
  HardDrive,
  Key,
  BookOpen,
  Menu,
  X,
  Bell,
  HelpCircle
} from 'lucide-react';

const DynamicSidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const { statusMessage, clearStatusMessage } = useApp();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    admin: false,
    tools: false
  });
  const [favorites, setFavorites] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Dynamic menu configuration
  const menuSections = useMemo(() => [
    {
      id: 'main',
      title: 'Main Navigation',
      items: [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
          icon: Home,
          permission: 'assets:read',
          description: 'Overview and analytics',
          shortcut: 'Ctrl+1'
    },
    { 
      path: '/discovery', 
      label: 'Discovery', 
          icon: SearchIcon,
          permission: 'assets:read',
          description: 'Network discovery and scanning',
          shortcut: 'Ctrl+2'
    },
    { 
      path: '/devices', 
      label: 'Devices', 
          icon: Monitor,
          permission: 'assets:read',
          description: 'Discovered network devices',
          shortcut: 'Ctrl+3'
    },
    { 
      path: '/assets', 
      label: 'Assets', 
          icon: HardDrive,
          permission: 'assets:read',
          description: 'Asset inventory management',
          shortcut: 'Ctrl+4'
    },
    { 
      path: '/credentials', 
      label: 'Credentials', 
          icon: Key,
          permission: 'credentials:read',
          description: 'Credential management',
          shortcut: 'Ctrl+5'
        }
      ]
    },
    {
      id: 'admin',
      title: 'Administration',
      items: [
        { 
          path: '/labs', 
          label: 'Lab Management', 
          icon: Building,
          permission: 'admin:read',
          description: 'Lab and environment management',
          shortcut: 'Ctrl+6'
        },
    { 
      path: '/admin-settings', 
      label: 'Global Settings', 
          icon: Settings,
          permission: 'admin:read',
          description: 'System configuration',
          shortcut: 'Ctrl+7'
        }
      ]
    },
    {
      id: 'tools',
      title: 'Tools & Utilities',
      items: [
    { 
      path: '/workflow', 
          label: 'Workflow Guide', 
          icon: BookOpen,
          permission: null,
          description: 'Step-by-step guidance',
          shortcut: 'Ctrl+8'
        }
      ]
    }
  ], []);

  // Filter items based on permissions and search
  const filteredSections = useMemo(() => {
    return menuSections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        (!item.permission || hasPermission(item.permission)) &&
        (item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })).filter(section => section.items.length > 0);
  }, [menuSections, hasPermission, searchQuery]);

  // Handle section toggle
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Handle item click (for recent items tracking)
  const handleItemClick = (item) => {
    setRecentItems(prev => {
      const filtered = prev.filter(recent => recent.path !== item.path);
      return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 5);
    });
  };

  // Handle favorite toggle
  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const isFavorite = prev.some(fav => fav.path === item.path);
      if (isFavorite) {
        return prev.filter(fav => fav.path !== item.path);
      } else {
        return [...prev, { ...item, timestamp: Date.now() }];
      }
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        const sections = filteredSections.flatMap(s => s.items);
        const item = sections.find(item => item.shortcut === `Ctrl+${e.key}`);
        if (item) {
          e.preventDefault();
          navigate(item.path);
          handleItemClick(item);
        }
      }
      
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
      
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredSections, showSearch, navigate]);

  // Render menu item
  const renderMenuItem = (item, isFavorite = false) => {
    const isActive = location.pathname === item.path;
    const IconComponent = item.icon;
    
    return (
      <div key={item.path} className="group relative">
        <Link
          to={item.path}
          onClick={() => handleItemClick(item)}
          className={cn(
            "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div className={cn(
            "transition-all duration-200",
            isActive ? "scale-105" : "group-hover:scale-105"
          )}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{item.label}</span>
              {isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
            </div>
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.description}
              </p>
            )}
          </div>
          {item.shortcut && !isCollapsed && (
            <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              {item.shortcut.replace('Ctrl+', '⌘')}
            </Badge>
          )}
        </Link>
        
        {/* Favorite toggle button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(item);
          }}
          className={cn(
            "absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn(
            "w-3 h-3",
            isFavorite ? "text-yellow-500 fill-current" : "text-muted-foreground"
          )} />
        </button>
      </div>
    );
  };

  // Render section header
  const renderSectionHeader = (section) => {
    const isExpanded = expandedSections[section.id];
    const hasActiveItem = section.items.some(item => location.pathname === item.path);
    
    return (
      <button
        onClick={() => toggleSection(section.id)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          hasActiveItem ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>{section.title}</span>
        <div className="transition-transform duration-200">
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
      </button>
    );
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col w-16 bg-background border-r border-border">
        {/* Collapsed Header */}
        <div className="p-3 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
        </div>

        {/* Collapsed Menu Items */}
        <div className="flex-1 py-4 space-y-2">
          {filteredSections.flatMap(section => section.items).map(item => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;

  return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleItemClick(item)}
        className={cn(
                  "flex items-center justify-center p-3 rounded-md transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                title={item.label}
              >
                <IconComponent className="w-4 h-4" />
                {favorites.some(fav => fav.path === item.path) && (
                  <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapsed Footer */}
        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="w-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 bg-background border-r border-border">
      {/* Dynamic Header */}
        <div className="px-4 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between mb-3">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">DiscoverIT</h1>
              <p className="text-xs text-muted-foreground">Network Discovery & Asset Management</p>
              </div>
          </Link>
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleCollapse}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
              title="Collapse sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
          {searchQuery && (
          <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
          </button>
          )}
        </div>
        </div>

        {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-4 space-y-6">
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 px-3 py-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Favorites
                </span>
              </div>
              <div className="space-y-1">
                {favorites.map(item => renderMenuItem(item, true))}
              </div>
                </div>
              )}

          {/* Recent Items */}
          {recentItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 px-3 py-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent
                </span>
              </div>
            <div className="space-y-1">
                {recentItems.slice(0, 3).map(item => renderMenuItem(item))}
            </div>
          </div>
        )}

          {/* Main Menu Sections */}
          {filteredSections.map(section => (
            <div key={section.id} className="space-y-2">
              {renderSectionHeader(section)}
              {expandedSections[section.id] && (
          <div className="space-y-1">
                  {section.items.map(item => renderMenuItem(item))}
                  </div>
                )}
            </div>
            ))}
          </div>
        </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="px-4 py-3 border-t border-border">
          <div className="bg-card border border-border rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-card-foreground">{statusMessage}</span>
              <button
                onClick={clearStatusMessage}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Tracker */}
      <SidebarScanTracker />

      {/* Dynamic Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name || user?.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                {user?.role?.name || 'User'}
                </p>
              </div>
          </div>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
              <button
                onClick={logout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
                title="Logout"
              >
              <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
      </div>
      </div>
  );
};

export default DynamicSidebar;
