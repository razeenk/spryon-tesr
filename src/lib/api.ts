// API base URL — set NEXT_PUBLIC_API_URL in .env.local for production
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

// Token helpers
export const TOKEN_KEY = 'spryon_token';
export const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Returns base headers with Authorization for direct fetch() calls */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
    const token = getToken();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return { ...h, ...extra };
}

// Generic fetch wrapper
export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<{ data?: T; error?: string; status: number }> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;


    try {
        const res = await fetch(`${API}${path}`, { ...options, headers });
        const data = (await res.json()) as T & { error?: string };
        if (!res.ok) {
            const msg = (data as { error?: string }).error ?? 'Something went wrong';
            return { error: msg, status: res.status };
        }
        return { data, status: res.status };
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Network error';
        if (process.env.NODE_ENV === 'development') console.warn('[API] Fetch failed:', msg);
        return { error: msg, status: 0 };
    }
}


// ─── Auth API ────────────────────────────────────────────────────────────────

export interface RegisterPayload {
    name: string;
    email: string;
    phone: string;
    restaurantName: string;
    city: string;
    password: string;
    ref?: string;
}

export interface AuthResponse {
    token: string;
    userId: string;
    email: string;
    requiresVerification: boolean;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
    };
}

export interface RestaurantConfig {
    id: string;
    name: string;
    city: string;
    logo_url: string | null;
    social_links: {
        instagram?: string;
        whatsapp?: string;
        facebook?: string;
        website?: string;
        instagram_enabled?: boolean;
        whatsapp_enabled?: boolean;
        facebook_enabled?: boolean;
        website_enabled?: boolean;
    } | null;
    theme: {
        accent: string;
        background: string;
        text: string;
    } | null;
}

export interface MeResponse {
    id: string;
    name: string;
    email: string;
    phone?: string;
    emailVerified: boolean;
    restaurant: RestaurantConfig | null;
    platformUrl?: string;
}

export async function apiRegister(payload: RegisterPayload) {
    return apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function apiLogin(email: string, password: string) {
    return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function apiVerifyEmail(email: string, code: string) {
    return apiFetch<{ message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
    });
}

export async function apiResendOtp(email: string) {
    return apiFetch<{ message: string }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function apiForgotPassword(email: string) {
    return apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function apiResetPassword(email: string, code: string, newPassword: string) {
    return apiFetch<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
    });
}

export async function apiMe() {
    return apiFetch<MeResponse>('/auth/me');
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function apiUploadImage(file: File): Promise<{ url?: string; error?: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch(`${API}/api/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok) return { error: data.error ?? 'Upload failed' };
        return { url: data.url };
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Upload failed' };
    }
}

// ─── Restaurant config ────────────────────────────────────────────────────────

export async function apiUpdateRestaurantLogo(logo_url: string) {
    return apiFetch<{ ok: boolean }>('/api/restaurant/logo', {
        method: 'POST',
        body: JSON.stringify({ logo_url }),
    });
}

export async function apiUpdateRestaurantConfig(config: {
    social_links?: object; theme?: object; name?: string; page_title?: string;
    page_description?: string; slug?: string; location_url?: string;
    is_open?: number; currency?: string; timezone?: string;
    phone?: string; email?: string; address?: string; opening_hours?: object;
}) {
    return apiFetch<{ ok: boolean }>('/api/restaurant/config', {
        method: 'PATCH',
        body: JSON.stringify(config),
    });
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
    return apiFetch<{ ok: boolean; message?: string }>('/api/restaurant/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export async function apiUpdateUserProfile(name?: string, email?: string, phone?: string) {
    return apiFetch<{ ok: boolean }>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, email, phone }),
    });
}

export async function apiResetMenuData() {
    return apiFetch<{ ok: boolean; message?: string }>('/api/restaurant/reset-menu', {
        method: 'POST',
    });
}
