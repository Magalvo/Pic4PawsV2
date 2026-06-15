export const workerUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_WORKER_URL;
  if (!url) throw new Error('EXPO_PUBLIC_WORKER_URL is not set');
  return url;
};
