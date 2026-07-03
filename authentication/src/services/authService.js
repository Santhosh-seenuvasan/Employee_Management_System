// src/services/authService.js

function getApiBase() {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8080`;
}

const LOGIN_PATH = '/api/auth/login';

// ✅ Modern fetch + timeout
async function postJson(url, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await response.json().catch(() => ({
            success: false,
            message: 'Invalid response from server'
        }));

        return { httpStatus: response.status, data };

    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timeout. Server not responding.');
        }
        throw new Error('Cannot reach backend server.');
    }
}

// ✅ Login API
export async function login(email, password, remember) {
    const API_URL = getApiBase();
    const payload = { email, password, rememberMe: remember };

    let result;
    try {
        result = await postJson(API_URL + LOGIN_PATH, payload);
    } catch (err) {
        throw new Error(err.message || 'Network error.');
    }

    if (result.httpStatus >= 500) {
        throw new Error('Server error. Try again later.');
    }

    const data = result.data;

    if (!data.success) {
        throw new Error(data.message || 'Invalid credentials.');
    }

    return data;
}

// ✅ Better storage handling
export function saveAuth(data) {
    try {
        const storage = data.rememberMe ? localStorage : sessionStorage;

        storage.setItem('ems_token', data.token || '');
        storage.setItem('ems_role', data.role || '');
        storage.setItem('ems_employeeCode', data.employeeCode || '');
        storage.setItem('ems_email', data.email || '');
        storage.setItem('ems_fullName', data.fullName || '');
    } catch (e) {
        console.error('Storage error:', e);
    }
}

// ✅ Token usage for future APIs
export function getAuthHeaders() {
    const token =
        localStorage.getItem('ems_token') ||
        sessionStorage.getItem('ems_token');

    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// ✅ Secure redirect
export function buildRedirectUrl(data) {
    const allowedPaths = [
        'admin_hr/admin_hr_dashboard/code.html',
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

    return '/' + safePath + '?' + params.toString();
}