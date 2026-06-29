export const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

const CORS_ALLOW_HEADERS = 'Content-Type, Authorization';
const CORS_ALLOW_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

export const corsPreflightResponse = (origin: string): Response =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': CORS_ALLOW_METHODS,
      'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });

export const withCors = (response: Response, origin: string): Response => {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
  headers.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
