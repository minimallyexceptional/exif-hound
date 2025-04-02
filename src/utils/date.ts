export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Not available';
  try {
    const date = new Date(dateString.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$2'));
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}; 