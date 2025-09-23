import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for real-time scan updates
 * Polls the API for active scan task updates
 */
export const useScanUpdates = (activeScanTask, onUpdate) => {
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(null);

  useEffect(() => {
    // Only poll if there's an active scan
    if (activeScanTask && activeScanTask.status === 'running') {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up polling interval
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/v2/scan-tasks/active');
          if (response.ok) {
            const updatedTask = await response.json();
            
            // Only update if the data has actually changed
            const currentUpdate = JSON.stringify(updatedTask);
            if (currentUpdate !== lastUpdateRef.current) {
              lastUpdateRef.current = currentUpdate;
              onUpdate(updatedTask);
            }
          }
        } catch (error) {
          console.error('Failed to fetch scan updates:', error);
        }
      }, 2000); // Poll every 2 seconds
    } else {
      // Clear interval if no active scan
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeScanTask, onUpdate]);

  // Return cleanup function
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
};

/**
 * Hook for fetching scan results
 */
export const useScanResults = (scanTaskId) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    if (!scanTaskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v2/scan-tasks/${scanTaskId}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        setError('Failed to fetch scan results');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [scanTaskId]);

  return { results, loading, error, refetch: fetchResults };
};
