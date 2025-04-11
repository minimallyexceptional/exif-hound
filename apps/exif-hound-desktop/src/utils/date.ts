export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Not available';
  try {
    // EXIF dates often use colon as separator in the date part (YYYY:MM:DD)
    // We need to replace them with hyphens for proper parsing
    const fixedDateString = dateString.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(fixedDateString);
    
    if (isNaN(date.getTime())) return dateString;
    
    // Format date in a more human-readable way
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Format date in a simpler format (without weekday) for compact displays
 */
export const formatShortDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Not available';
  try {
    const fixedDateString = dateString.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(fixedDateString);
    
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Format date to show only the date part (no time)
 */
export const formatDateOnly = (dateString: string | null): string => {
  if (!dateString) return 'Not available';
  try {
    const fixedDateString = dateString.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(fixedDateString);
    
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Format a timestamp into a relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return formatShortDateTime(new Date(timestamp).toISOString());
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
}; 