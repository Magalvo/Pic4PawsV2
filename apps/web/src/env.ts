export const workerUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!url) throw new Error('NEXT_PUBLIC_WORKER_URL is not set');
  return url;
};
