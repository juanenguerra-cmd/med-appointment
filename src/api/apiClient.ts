const LOCAL_USER_OVERRIDES_KEY = 'medAppointment.userOverrides.v1';

function mergeJsonHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  if (!merged.has('Content-Type')) merged.set('Content-Type', 'application/json');
  return merged;
}

function normalizeSafetyRequest(url: string, options?: RequestInit): { url: string; options?: RequestInit } {
  const method = String(options?.method || 'GET').toUpperCase();
  const appointmentDeleteMatch = url.match(/^\/api\/appointments\/([^/?#]+)$/);

  if (method === 'DELETE' && appointmentDeleteMatch) {
    return {
      url: `/api/soft-delete/appointments/${encodeURIComponent(decodeURIComponent(appointmentDeleteMatch[1]))}`,
      options: {
        ...options,
        method: 'POST',
        headers: mergeJsonHeaders(options?.headers),
        body: options?.body || JSON.stringify({ note: 'Deleted from appointment log UI' }),
      },
    };
  }

  return { url, options };
}

function readLocalUserOverrides(): Record<string, any> {
  try {
    const raw = localStorage.getItem(LOCAL_USER_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalUserOverride(userId: string, patch: Record<string, any>) {
  if (!userId) return;
  try {
    const current = readLocalUserOverrides();
    current[userId] = {
      ...(current[userId] || {}),
      ...patch,
      id: userId,
      updatedAt: new Date().toISOString(),
      localOnly: true,
    };
    localStorage.setItem(LOCAL_USER_OVERRIDES_KEY, JSON.stringify(current));
  } catch {
    // If localStorage is unavailable, the UI will still update for the current render path.
  }
}

function overlayLocalUserOverrides<T>(url: string, value: T): T {
  if (!url.startsWith('/api/users') || !Array.isArray(value)) return value;
  const overrides = readLocalUserOverrides();
  if (!Object.keys(overrides).length) return value;
  return value.map((user: any) => {
    const override = overrides[String(user?.id || '')];
    return override ? { ...user, ...override } : user;
  }) as T;
}

async function tryFallbackUserUpdate<T>(url: string, options?: RequestInit): Promise<T | undefined> {
  const method = String(options?.method || 'GET').toUpperCase();
  if (url !== '/api/users/update' || method !== 'POST') return undefined;

  let payload: any = null;
  try {
    payload = options?.body ? JSON.parse(String(options.body)) : null;
  } catch {
    payload = null;
  }

  const userId = String(payload?.id || payload?.userId || '').trim();
  if (!userId) return undefined;

  const patchBody = JSON.stringify(payload);
  const headers = mergeJsonHeaders(options?.headers);
  const fallbackUrls = [`/api/users/${encodeURIComponent(userId)}`];
  const fallbackMethods = ['PATCH', 'PUT'];

  for (const fallbackUrl of fallbackUrls) {
    for (const fallbackMethod of fallbackMethods) {
      try {
        const response = await fetch(fallbackUrl, {
          ...options,
          method: fallbackMethod,
          headers,
          body: patchBody,
        });
        if (response.ok) {
          if (response.status === 204) return payload as T;
          const value = await response.json().catch(() => payload);
          return value as T;
        }
      } catch {
        // Continue to next fallback.
      }
    }
  }

  writeLocalUserOverride(userId, payload);
  return {
    ok: true,
    localOnly: true,
    user: payload,
    message: 'Saved locally because the backend user update endpoint is not available.',
  } as T;
}

function filterActiveAppointmentResponse<T>(url: string, value: T): T {
  if (!url.startsWith('/api/appointments?') || !Array.isArray(value)) return value;
  return value.filter((appointment: any) => !appointment?.deletedAt) as T;
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const request = normalizeSafetyRequest(url, options);
  const res = await fetch(request.url, request.options);

  if (!res.ok) {
    const fallback = await tryFallbackUserUpdate<T>(request.url, request.options);
    if (fallback !== undefined) return fallback;

    let message = `API error ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      message = body?.error || body?.message || JSON.stringify(body);
    } catch {
      const text = await res.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (res.status === 204) return null as T;
  const value = await res.json() as T;
  const appointmentFiltered = filterActiveAppointmentResponse(request.url, value);
  return overlayLocalUserOverrides(request.url, appointmentFiltered);
}
