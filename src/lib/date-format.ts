export function formatDateTimeNoSeconds(input: string | Date) {
  const value = input instanceof Date ? input : new Date(input);

  return value.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}
