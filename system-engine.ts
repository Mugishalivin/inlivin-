/**
 * Utility for exporting table data to CSV format.
 */
export const exportTableToCSV = (data: any[], filename: string): void => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(fieldName => {
          const value = row[fieldName] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Deterministic hash to decide if a user falls into a fractional rollout percentage.
 * Ensures a user consistently sees the same feature version.
 */
export const isFeatureEnabledForUser = (
  userId: string,
  rolloutPercentage: number
): boolean => {
  if (rolloutPercentage >= 100) return true;
  if (rolloutPercentage <= 0) return false;

  // Simple Jenkins-style hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash += userId.charCodeAt(i);
    hash += hash << 10;
    hash ^= hash >> 6;
  }
  hash += hash << 3;
  hash ^= hash >> 11;
  hash += hash << 15;

  return Math.abs(hash % 100) < rolloutPercentage;
};