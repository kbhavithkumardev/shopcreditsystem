const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  explicitToken?: string,
): Promise<T> {
  let authToken = explicitToken;

  if (!authToken && typeof window !== 'undefined') {
    const isPortalPath = window.location.pathname.startsWith('/portal');
    if (isPortalPath) {
      authToken = localStorage.getItem('portal_token') || localStorage.getItem('auth_token') || undefined;
    } else {
      authToken = localStorage.getItem('auth_token') || undefined;
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });
  } catch (netErr: any) {
    throw new Error(`Network error connecting to API (${url}): ${netErr.message || netErr}`);
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // If 401 and we are in browser on a protected dashboard route, clear token and redirect
    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/dashboard')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      }
    }

    let errorMsg = 'An error occurred';
    if (Array.isArray(json.message)) {
      errorMsg = json.message.join(', ');
    } else if (typeof json.message === 'string') {
      errorMsg = json.message;
    } else if (typeof json.error === 'string') {
      errorMsg = json.error;
    } else if (json.errorCode) {
      errorMsg = `${json.errorCode}: ${res.statusText}`;
    } else {
      errorMsg = `HTTP error ${res.status}`;
    }
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}

export function formatINR(amount: number | string | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

