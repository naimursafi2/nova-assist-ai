export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
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

export function createCheckoutSession(payload: {
  plan: string;
  userId: string;
  email?: string | null;
  coupon?: string;
}) {
  return apiRequest<CheckoutResponse>("/api/payments/create-checkout-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
