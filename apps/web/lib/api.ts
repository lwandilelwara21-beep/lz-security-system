const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001'}/api/v1`;

export async function authenticatedFetch(
  path: string,
  accessToken: string,
  accessTokenKey: string,
  refreshTokenKey: string,
  init: RequestInit = {},
) {
  const send = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  const response = await send(accessToken);
  if (response.status !== 401) {
    return { response, accessToken };
  }

  const refreshToken = localStorage.getItem(refreshTokenKey);
  if (!refreshToken) {
    return { response, accessToken };
  }

  const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const refreshResult = await refreshResponse.json().catch(() => ({}));

  if (!refreshResponse.ok || !refreshResult.accessToken) {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    return { response, accessToken };
  }

  localStorage.setItem(accessTokenKey, refreshResult.accessToken);
  return {
    response: await send(refreshResult.accessToken),
    accessToken: refreshResult.accessToken as string,
  };
}