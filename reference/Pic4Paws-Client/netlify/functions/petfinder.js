const PETFINDER_API_URL = 'https://api.petfinder.com/v2';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

const isAllowedPath = path => {
  return path === '/animals' || /^\/animals\/\d+$/.test(path);
};

const getAccessToken = async () => {
  if (cachedToken && cachedTokenExpiresAt > Date.now()) {
    return cachedToken;
  }

  const clientId = process.env.PETFINDER_CLIENT_ID;
  const clientSecret = process.env.PETFINDER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Petfinder credentials');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(`${PETFINDER_API_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    throw new Error('Unable to authenticate with Petfinder');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 0) * 1000;

  return cachedToken;
};

export const handler = async event => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { message: 'Method not allowed' });
  }

  const params = event.queryStringParameters || {};
  const path = params.path || '/animals';

  if (!isAllowedPath(path)) {
    return jsonResponse(400, { message: 'Unsupported Petfinder path' });
  }

  try {
    const token = await getAccessToken();
    const url = new URL(`${PETFINDER_API_URL}${path}`);

    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'path' && value) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, max-age=60'
      },
      body
    };
  } catch (error) {
    return jsonResponse(500, { message: error.message });
  }
};
