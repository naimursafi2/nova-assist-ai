export const API_URL = import.meta.env.VITE_API_URL || "";

async function authedRequest<T>(path: string, token: string | null, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Server request failed");
  }

  return data as T;
}

export type CheckoutResponse = {
  success: boolean;
  url?: string;
  redirectUrl?: string;
  free?: boolean;
  message?: string;
};

export function createCheckoutSession(token: string | null, payload: { plan: string; coupon?: string }): Promise<CheckoutResponse> {
  if (!API_URL) {
    return Promise.resolve<CheckoutResponse>({
      success: true,
      free: true,
      message: "Demo mode: no backend configured. Connect a real Express server URL (VITE_API_URL) to accept real payments.",
    });
  }
  return authedRequest<CheckoutResponse>("/api/payments/create-checkout-session", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelSubscription(token: string | null) {
  return authedRequest<{ success: boolean }>("/api/payments/cancel-subscription", token, { method: "POST" });
}

export function fetchAdminUsers(token: string | null) {
  return authedRequest<Array<{ userId: string; name: string; email: string; plan: string; createdAt: string; lastLoginAt: string; profileImage?: string }>>(
    "/api/admin/users",
    token
  );
}
