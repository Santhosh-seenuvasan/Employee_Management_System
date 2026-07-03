import { API_HOST } from '../../../services/api.js';

export async function login(email, password, remember) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(`${API_HOST}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe: remember }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.status >= 500) {
            throw new Error('Server error. Try again later.');
        }

        const data = await response.json().catch(() => ({
            success: false,
            message: 'Invalid response from server'
        }));

        if (!data.success) {
            throw new Error(data.message || 'Invalid credentials.');
        }

        return data;

    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timeout. Server not responding.');
        }
        if (err.message) throw err;
        throw new Error('Cannot reach backend server.');
    }
}

export function getAuthHeaders() {
    const token = (() => {
        try {
            const flag = localStorage.getItem('ems_rememberMe');
            if (flag === 'true') return localStorage.getItem('ems_token');
            if (flag === 'false') return sessionStorage.getItem('ems_token');
            return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token');
        } catch (_) { return null; }
    })();

    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

export function buildRedirectUrl(data) {
    const allowedPaths = [
        '/admin-dashboard/dashboard',
        'management/management_dashboard/code.html',
        'employee/employee_dashboard/code.html'
    ];

    const safePath = allowedPaths.includes(data.redirectUrl)
        ? data.redirectUrl
        : '';

    const params = new URLSearchParams({
        ems_token: data.token || '',
        ems_role: data.role || '',
        ems_employeeCode: data.employeeCode || '',
        ems_email: data.email || '',
        ems_fullName: data.fullName || ''
    });

    const redirectPath = safePath.startsWith('/') ? safePath : '/' + safePath;
    return redirectPath + '?' + params.toString();
}

export async function forgotPassword(email) {
    const response = await fetch(`${API_HOST}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to send OTP.');
    }

    return data;
}

export async function verifyOtp(email, otp) {
    const response = await fetch(`${API_HOST}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid OTP.');
    }

    return data;
}

export async function resendOtp(email) {
    const response = await fetch(`${API_HOST}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to resend OTP.');
    }

    return data;
}

export async function resetPassword(email, newPassword, confirmPassword) {
    const response = await fetch(`${API_HOST}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, confirmPassword })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Password reset failed.');
    }

    return data;
}