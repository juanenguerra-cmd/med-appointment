function normalizeSafetyRequest(url: string, options?: RequestInit): { url: string; options?: RequestInit } {
  const method = String(options?.method || 'GET').toUpperCase();
  const appointmentDeleteMatch = url.match(/^\/api\/appointments\/([^/?#]+)$/);

  if (method === 'DELETE' && appointmentDeleteMatch) {
    return {
      url: `/api/soft-delete/appointments/${encodeURIComponent(decodeURIComponent(appointmentDeleteMatch[1]))}`,
      options: {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        body: options?.body || JSON.stringify({ note: 'Deleted from appointment log UI' }),
      },
    };
  }

  return { url, options };
}

function filterActiveAppointmentResponse<T>(url: string, value: T): T {
  if (!url.startsWith('/api/appointments?') || !Array.isArray(value)) return value;
  return value.filter((appointment: any) => !appointment?.deletedAt) as T;
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const request = normalizeSafetyRequest(url, options);
  const res = await fetch(request.url, request.options);

  if (!res.ok) {
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
  return filterActiveAppointmentResponse(request.url, value);
}
