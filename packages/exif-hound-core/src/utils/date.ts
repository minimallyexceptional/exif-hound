export const formatShortDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Not available';
  try {
    const fixedDateString = dateString.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(fixedDateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};
