/**
 * Generate a unique ID for entities
 * Using a combination of timestamp and random string
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Format a date in a user-friendly way
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time in a user-friendly way
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate the success rate for an exercise record
 */
export const calculateSuccessRate = (successful: number, total: number): number => {
  if (total === 0) return 0;
  return (successful / total) * 100;
};

/**
 * Convert minutes to a human-readable duration string
 */
export const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}; 
