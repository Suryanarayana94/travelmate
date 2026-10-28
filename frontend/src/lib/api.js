const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'travelmate_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    isFormData = false,
    signal,
    auth = true
  } = options;

  const token = getToken();
  const requestHeaders = { ...headers };
  if (auth && token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isFormData && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the TravelMate API. Please check that the backend is running.', 0);
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(
      payload.message || `Request failed with status ${response.status}`,
      response.status,
      payload.details
    );
  }

  return payload;
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiFetch(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => apiFetch(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' })
};
