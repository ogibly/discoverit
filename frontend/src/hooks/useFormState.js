import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form state with common patterns
 * @param {Object} initialForm - Initial form state
 * @param {Function} onReset - Optional reset callback
 * @returns {Object} Form state and handlers
 */
export const useFormState = (initialForm, onReset) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = useCallback((updates) => {
    setForm(prev => ({ ...prev, ...updates }));
    // Clear errors when form is updated
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [errors]);

  const setField = useCallback((field, value) => {
    updateForm({ [field]: value });
  }, [updateForm]);

  const setError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setIsSubmitting(false);
    if (onReset) {
      onReset();
    }
  }, [initialForm, onReset]);

  const validateForm = useCallback((validationRules) => {
    const newErrors = {};
    
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = form[field];
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = rules.required;
      } else if (rules.pattern && !rules.pattern.test(value)) {
        newErrors[field] = rules.patternMessage || 'Invalid format';
      } else if (rules.minLength && value.length < rules.minLength) {
        newErrors[field] = rules.minLengthMessage || `Minimum length is ${rules.minLength}`;
      } else if (rules.maxLength && value.length > rules.maxLength) {
        newErrors[field] = rules.maxLengthMessage || `Maximum length is ${rules.maxLength}`;
      } else if (rules.custom && !rules.custom(value)) {
        newErrors[field] = rules.customMessage || 'Invalid value';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  return {
    form,
    errors,
    isSubmitting,
    updateForm,
    setField,
    setError,
    clearErrors,
    resetForm,
    validateForm,
    setIsSubmitting
  };
};

/**
 * Custom hook for managing list state with common operations
 * @param {Array} initialItems - Initial items array
 * @returns {Object} List state and handlers
 */
export const useListState = (initialItems = []) => {
  const [items, setItems] = useState(initialItems);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const toggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(items.map(item => item.id || item));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isSelected = useCallback((itemId) => {
    return selectedItems.includes(itemId);
  }, [selectedItems]);

  const filteredAndSortedItems = useCallback(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType || item.status === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, searchTerm, filterType, sortBy, sortOrder]);

  const paginatedItems = useCallback(() => {
    const filtered = filteredAndSortedItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  return {
    items,
    setItems,
    selectedItems,
    setSelectedItems,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    filteredAndSortedItems,
    paginatedItems
  };
};

/**
 * Custom hook for managing modal state
 * @param {boolean} initialOpen - Initial modal state
 * @returns {Object} Modal state and handlers
 */
export const useModalState = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState(null);

  const openModal = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    setIsOpen
  };
};
