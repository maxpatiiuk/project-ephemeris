export const serializeDate = (date: Date): string =>
  date.toLocaleDateString().replaceAll('/', '_');

export const deserializeDate = (dateString: string): Date =>
  new Date(dateString.replaceAll('_', '/'));
