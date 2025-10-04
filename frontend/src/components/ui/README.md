# Resizable UI Components

This directory contains modern, user-friendly resizable UI components that enhance the user experience by allowing users to customize their workspace layout.

## Components

### ResizablePanel
A flexible panel component that can be resized by users.

**Features:**
- Horizontal and vertical resizing
- Minimum and maximum size constraints
- Smooth animations and transitions
- Mouse and touch support
- Customizable resize handles

**Usage:**
```jsx
<ResizablePanel
  minSize={200}
  maxSize={800}
  defaultSize={400}
  direction="horizontal"
  resizable={true}
  onSizeChange={(newSize) => console.log('New size:', newSize)}
>
  <div>Panel content</div>
</ResizablePanel>
```

### ResizableLayout
A layout component that manages multiple resizable panels.

**Features:**
- Automatic panel management
- localStorage persistence
- Gap control between panels
- Responsive behavior
- Layout reset functionality

**Usage:**
```jsx
<ResizableLayout
  direction="horizontal"
  storageKey="my-layout"
  defaultSizes={[300, 500, 200]}
  minSizes={[200, 300, 150]}
  resizable={true}
  gap={8}
>
  <div>Panel 1</div>
  <div>Panel 2</div>
  <div>Panel 3</div>
</ResizableLayout>
```

### CollapsibleSidebar
A sophisticated sidebar component with collapse/expand functionality.

**Features:**
- Smooth collapse/expand animations
- Resizable when expanded
- Hover preview when collapsed
- localStorage persistence
- Customizable toggle button position
- Keyboard shortcuts support

**Usage:**
```jsx
<CollapsibleSidebar
  storageKey="main-sidebar"
  defaultCollapsed={false}
  expandedWidth={256}
  collapsedWidth={64}
  minWidth={200}
  maxWidth={400}
  resizable={true}
  showToggle={true}
  togglePosition="top-right"
>
  <Navigation />
</CollapsibleSidebar>
```

## Layout Context

The `LayoutContext` provides global layout state management:

```jsx
const { 
  sidebarCollapsed, 
  sidebarWidth, 
  layoutPreferences,
  toggleSidebar, 
  setSidebarState,
  updateLayoutPreference,
  resetLayout 
} = useLayout();
```

## Keyboard Shortcuts

The application includes keyboard shortcuts for enhanced productivity:

- **Ctrl/Cmd + B**: Toggle sidebar
- **Ctrl/Cmd + Shift + R**: Reset layout
- **F11**: Toggle fullscreen
- **Esc**: Close modals/overlays

## UX Principles

### Modern Design
- Smooth animations and transitions
- Intuitive resize handles
- Visual feedback during interactions
- Consistent spacing and typography

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management

### Performance
- Efficient re-rendering
- Debounced resize events
- Memory leak prevention
- Optimized animations

### User Experience
- Persistent user preferences
- Responsive design
- Touch-friendly interactions
- Contextual help and tooltips

## Implementation Details

### State Management
- Uses React Context for global state
- localStorage for persistence
- Optimized re-renders with useCallback

### Event Handling
- Mouse and touch events
- Keyboard shortcuts
- Window resize handling
- Focus management

### Styling
- Tailwind CSS for styling
- CSS custom properties for theming
- Responsive design patterns
- Dark/light mode support

## Best Practices

1. **Always provide minimum sizes** to prevent panels from becoming too small
2. **Use meaningful storage keys** for localStorage persistence
3. **Provide visual feedback** during resize operations
4. **Test on different screen sizes** to ensure responsiveness
5. **Consider accessibility** when implementing custom interactions

## Browser Support

- Modern browsers with CSS Grid support
- Touch devices (iOS Safari, Chrome Mobile)
- Keyboard navigation
- Screen readers

## Future Enhancements

- [ ] Touch gesture support for mobile
- [ ] Multi-touch resize operations
- [ ] Layout templates and presets
- [ ] Advanced keyboard shortcuts
- [ ] Layout sharing between users
- [ ] Performance monitoring
- [ ] Accessibility improvements
