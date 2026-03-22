// ─── Super Admin API Helpers ─────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

function getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('spryon_admin_token');
}

function setAdminToken(t: string) { localStorage.setItem('spryon_admin_token', t); }
function clearAdminToken() { localStorage.removeItem('spryon_admin_token'); }

export function adminAuthHeaders(extra?: Record<string, string>): Record<string, string> {
    const token = getAdminToken();
    const h: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return { ...h, ...extra };
}

async function adminFetch<T>(path: string, opts?: RequestInit): Promise<{ data?: T; error?: string; status: number }> {
    const res = await fetch(`${API}${path}`, {
        ...opts,
        headers: adminAuthHeaders((opts?.headers as Record<string, string>) ?? {}),
    });
    try {
        const body = await res.json() as { ok?: boolean; error?: string } & T;
        if (!res.ok || !body.ok) return { error: (body.error ?? 'Request failed') as string, status: res.status };
        return { data: body, status: res.status };
    } catch {
        return { error: 'Failed to parse response', status: res.status };
    }
}

// Auth
export function adminGetToken() { return getAdminToken(); }
export function adminSetToken(t: string) { setAdminToken(t); }
export function adminClearToken() { clearAdminToken(); }
export async function apiAdminMe() { return adminFetch<{ admin: { id: string; email: string; name: string } }>('/admin/auth/me'); }
export async function apiAdminLogin(email: string, password: string) { return adminFetch<{ message: string }>('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }
export async function apiAdminVerifyOtp(email: string, otp: string) { return adminFetch<{ token: string; admin: { id: string; email: string; name: string } }>('/admin/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }); }
export async function apiAdminSetup(email: string, password: string, name: string) { return adminFetch<{ message: string }>('/admin/auth/setup', { method: 'POST', body: JSON.stringify({ email, password, name }) }); }

// Restaurants
export async function apiAdminRestaurants(params: Record<string, string> = {}) {
    const q = new URLSearchParams(params).toString();
    return adminFetch<{ restaurants: unknown[]; total: number; page: number }>(`/admin/restaurants${q ? '?' + q : ''}`);
}
export async function apiAdminGetRestaurant(id: string) { return adminFetch<{ restaurant: unknown; recentSessions: unknown[] }>(`/admin/restaurants/${id}`); }
export async function apiAdminUpdateRestaurantStatus(id: string, status: string, reason?: string) { return adminFetch<Record<string, unknown>>(`/admin/restaurants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }); }
export async function apiAdminDeleteRestaurant(id: string) { return adminFetch<Record<string, unknown>>(`/admin/restaurants/${id}`, { method: 'DELETE' }); }
export async function apiAdminResetSlug(id: string, slug: string) { return adminFetch<Record<string, unknown>>(`/admin/restaurants/${id}/slug`, { method: 'PATCH', body: JSON.stringify({ slug }) }); }
export async function apiAdminAssignPlan(restaurantId: string, planId: string, expiresAt?: number) { return adminFetch<Record<string, unknown>>(`/admin/restaurants/${restaurantId}/subscription`, { method: 'POST', body: JSON.stringify({ plan_id: planId, expires_at: expiresAt }) }); }

// Plans
export async function apiAdminPlans() { return adminFetch<{ plans: unknown[] }>('/admin/plans'); }
export async function apiAdminCreatePlan(data: Record<string, unknown>) { return adminFetch<{ id: string }>('/admin/plans', { method: 'POST', body: JSON.stringify(data) }); }
export async function apiAdminUpdatePlan(id: string, data: Record<string, unknown>) { return adminFetch<Record<string, unknown>>(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function apiAdminDeletePlan(id: string) { return adminFetch<Record<string, unknown>>(`/admin/plans/${id}`, { method: 'DELETE' }); }
export async function apiAdminSubscriptions() { return adminFetch<{ subscriptions: unknown[] }>('/admin/subscriptions'); }

// Affiliates
export async function apiAdminAffiliates() { return adminFetch<{ affiliates: unknown[] }>('/admin/affiliates'); }
export async function apiAdminCreateAffiliate(data: Record<string, unknown>) { return adminFetch<{ id: string; referralCode: string }>('/admin/affiliates', { method: 'POST', body: JSON.stringify(data) }); }
export async function apiAdminUpdateAffiliate(id: string, data: Record<string, unknown>) { return adminFetch<Record<string, unknown>>(`/admin/affiliates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function apiAdminAffiliateReferrals(id: string) { return adminFetch<{ referrals: unknown[] }>(`/admin/affiliates/${id}/referrals`); }

// Analytics & Audit
export async function apiAdminAnalytics() { return adminFetch<{ stats: Record<string, number>; topRestaurants: unknown[] }>('/admin/analytics'); }
export async function apiAdminAuditLogs(page = 1) { return adminFetch<{ logs: unknown[]; total: number }>(`/admin/audit-logs?page=${page}`); }
