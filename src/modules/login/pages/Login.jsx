import { useState, useRef, useEffect } from 'react';
import '../styles/login.css';
import '../styles/auth-modals.css';
import { login, forgotPassword, verifyOtp, resendOtp, resetPassword } from '../services/authService.js';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const [activeModal, setActiveModal] = useState(null);

    const [forgotInput, setForgotInput] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    const OTP_DURATION = 300;
    const [otpCountdown, setOtpCountdown] = useState(OTP_DURATION);
    const otpTimerRef = useRef(null);

    function startOtpTimer() {
        clearOtpTimer();
        setOtpCountdown(OTP_DURATION);
        otpTimerRef.current = setInterval(() => {
            setOtpCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(otpTimerRef.current);
                    otpTimerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    function clearOtpTimer() {
        if (otpTimerRef.current) {
            clearInterval(otpTimerRef.current);
            otpTimerRef.current = null;
        }
    }

    function formatTime(seconds) {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    useEffect(() => {
        return () => clearOtpTimer();
    }, []);

    function closeAllModals() {
        clearOtpTimer();
        setOtpCountdown(OTP_DURATION);
        setActiveModal(null);
        setForgotInput('');
        setOtpDigits(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setModalError('');
        setOtpError('');
        setResetError('');
        setModalLoading(false);
        setOtpLoading(false);
        setResetLoading(false);
        setResendLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoginError('');

        if (!email.trim() || !password) {
            setLoginError('Please enter your email and password.');
            return;
        }

        setLoading(true);

        try {
            const data = await login(email.trim(), password, remember);

            if (onLoginSuccess) {
                onLoginSuccess(data);
            }
        } catch (err) {
            setLoginError(err.message);
            setPassword('');
        } finally {
            setLoading(false);
        }
    }

    async function handleSendOtp() {

        setModalError('');

        if (!forgotInput.trim()) {
            setModalError('Please enter your registered email.');
            return;
        }

        try {

            setModalLoading(true);

            await forgotPassword(forgotInput.trim());

            setOtpDigits(['', '', '', '', '', '']);

            startOtpTimer();

            setActiveModal('otp');

        } catch (err) {

            setModalError(err.message);

        } finally {

            setModalLoading(false);

        }
    }

    async function handleVerifyOtp() {

        setOtpError('');

        const otp = otpDigits.join('');

        if (otp.length !== 6) {
            setOtpError('Please enter the 6-digit OTP.');
            return;
        }

        try {

            setOtpLoading(true);

            await verifyOtp(
                forgotInput.trim(),
                otp
            );

            clearOtpTimer();

            setActiveModal('reset');

        } catch (err) {

            setOtpError(err.message);

        } finally {

            setOtpLoading(false);

        }
    }

    async function handleResendOtp() {

        setOtpError('');

        try {

            setResendLoading(true);

            await resendOtp(forgotInput.trim());

            setOtpDigits(['', '', '', '', '', '']);

            startOtpTimer();

            setOtpError('A new OTP has been sent to your email.');

        } catch (err) {

            setOtpError(err.message);

        } finally {

            setResendLoading(false);

        }
    }

    const otpRefs = useRef([]);

    function handleOtpChange(index, value) {
        if (value.length > 1 || (value && !/^\d$/.test(value))) return;
        const next = [...otpDigits];
        next[index] = value;
        setOtpDigits(next);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    }

    function handleOtpPaste(index, e) {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        e.preventDefault();
        const next = [...otpDigits];
        for (let i = 0; i < pasted.length && i + index < 6; i++) {
            next[i + index] = pasted[i];
        }
        setOtpDigits(next);
        const focusIndex = Math.min(index + pasted.length, 5);
        otpRefs.current[focusIndex]?.focus();
    }

    function handleOtpKeyDown(index, e) {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }

    async function handleUpdatePassword() {

        setResetError('');

        if (newPassword.length < 8) {
            setResetError('Password must be at least 8 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetError('Passwords do not match.');
            return;
        }

        try {

            setResetLoading(true);

            await resetPassword(
                forgotInput.trim(),
                newPassword,
                confirmPassword
            );

            setNewPassword('');
            setConfirmPassword('');

            setActiveModal('success');

        } catch (err) {

            setResetError(err.message);

        } finally {

            setResetLoading(false);

        }
    }

    return (
        <div className="font-body-md text-on-surface antialiased">
            <div className="flex min-h-screen">

                {/* ── Left: Branding Panel ── */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
                    <img className="absolute inset-0 w-full h-full object-cover opacity-70"
                         src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRK7nwwgv39gTypr5_mo1gy-m7m6UMxXDYXmJ0HqBn4I-iC8X4Euo_hcs2vibj5xTB1VoOLqV3gszb-MvdvjNjNQ1_Ark8AUo06Wfaf6ZOL71wQDiSaeinKwVoKpYmbHgoba64XjezaDFs5iguYVOQwAxiJlhmFdKbrBx0DPfvdkQjpFNuSm9VNgCWv124t9uAYM1_d8M9AO1d8U-rf_y9D78w1iakIcvJeSB2u3UtINYRgm_XctzGZfGQ9RuxAksTQSBZJSzT-1E"
                         alt="team collaborating"/>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/10 to-blue-800/10"></div>

                    <div className="relative z-10 flex flex-col justify-between h-full px-16 py-20 w-full">
                        <div className="space-y-12">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-white text-[32px]" style={{fontVariationSettings: "'FILL' 1"}}>login</span>
                                <span className="font-bold text-3xl text-white tracking-tight">LOGIN Portal</span>
                            </div>
                            <div className="max-w-md">
                                <h1 className="text-4xl font-bold text-white leading-tight">
                                    Secure single sign-on for your entire organization.
                                </h1>
                                <p className="text-lg text-blue-100 leading-relaxed mt-10">
                                    Your gateway to smarter workforce management — seamless, secure, and built for scale.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-200 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>shield</span>
                                    <span className="text-sm text-blue-100">256-bit encryption</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-200 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>sync</span>
                                    <span className="text-sm text-blue-100">Real-time sync</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-200 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>groups</span>
                                    <span className="text-sm text-blue-100">Multi-role access</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-200 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
                                    <span className="text-sm text-blue-100">Live analytics</span>
                                </div>
                            </div>
                            <p className="text-xs text-blue-200/60 uppercase tracking-widest">&copy; 2026 LOGIN Portal. All rights reserved.</p>
                        </div>
                    </div>
                </div>

                {/* ── Right: Login Form ── */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
                    <div className="w-full" style={{maxWidth: 440}}>

                        <div className="mb-10">
                            <div className="lg:hidden flex items-center gap-3 mb-8">
                                <span className="material-symbols-outlined text-primary text-[32px]" style={{fontVariationSettings: "'FILL' 1"}}>login</span>
                                <span className="font-bold text-3xl text-primary tracking-tight">LOGIN Portal</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-slate-500">Please enter your credentials to access your dashboard.</p>
                        </div>

                        <form id="loginForm" className="w-full space-y-8" onSubmit={handleSubmit}>
                            {loginError && (
                                <div style={{
                                    color: '#dc2626',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '16px',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                }}>
                                    {loginError}
                                </div>
                            )}

                            {/* Email */}
                            <div className="w-full space-y-2">
                                <label className="block font-medium" htmlFor="email">Work Email</label>
                                <div className="w-full relative">
                                    <span className="material-symbols-outlined absolute left-4 inset-y-0 my-auto flex items-center text-outline">mail</span>
                                    <input id="email" type="email"
                                   className="w-full pl-12 pr-14 py-4 rounded-2xl border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                   placeholder="name@company.com" required
                                           value={email}
                                           onChange={(e) => setEmail(e.target.value)}/>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="w-full space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block font-medium" htmlFor="password">Password</label>
                                    <a href="#" id="forgotBtn" className="text-primary hover:underline text-sm"
                                       onClick={(e) => { e.preventDefault(); setActiveModal('forgot'); }}>Forgot password?</a>
                                </div>
                                <div className="w-full relative">
                                    <span className="material-symbols-outlined absolute left-4 inset-y-0 my-auto flex items-center text-outline">lock</span>
                                    <input id="password" type={showPassword ? 'text' : 'password'}
                                           className="w-full pl-12 pr-14 py-4 rounded-2xl border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                           placeholder="••••••••" required autoComplete="current-password"
                                           value={password}
                                           onChange={(e) => setPassword(e.target.value)}/>
                                    <button type="button" id="togglePassword"
                                              className="absolute right-3 inset-y-0 my-auto w-10 h-10 flex items-center justify-center rounded-xl text-outline hover:text-primary hover:bg-blue-50 transition-colors"
                                             aria-label={showPassword ? 'Hide password' : 'Show password'}
                                             title={showPassword ? 'Hide password' : 'Show password'}
                                             onClick={() => setShowPassword(!showPassword)}>
                                         <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                             {showPassword ? (
                                                 <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                                             ) : (
                                                 <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></>
                                             )}
                                         </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="remember" className="w-5 h-5 rounded border-outline text-primary accent-primary"
                                       checked={remember}
                                       onChange={(e) => setRemember(e.target.checked)}/>
                                <label htmlFor="remember" className="text-slate-500">Keep me signed in for a day</label>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                    className="w-full py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-md">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-slate-500">
                                Need an account?
                                <a href="#" className="text-primary font-medium hover:underline"> Contact your IT administrator</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL STEP 1 – FORGOT PASSWORD */}
            <div id="modalForgot" className={`modal-backdrop ${activeModal === 'forgot' ? 'show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="titleForgot">
                <div className="modal-card">
                    <button className="modal-close" onClick={closeAllModals} aria-label="Close">&times;</button>

                    <div className="step-dots" aria-hidden="true">
                        <div className="step-dot active"></div>
                        <div className="step-dot"></div>
                        <div className="step-dot"></div>
                        <div className="step-dot"></div>
                    </div>

                    <div className="modal-icon blue">
                        <span className="material-symbols-outlined">lock_reset</span>
                    </div>

                    <h2 id="titleForgot" className="modal-title">Forgot Password</h2>
                    <p className="modal-subtitle">Enter your registered email or employee ID to receive a password reset OTP.</p>

                    <div className="modal-form">

                        {modalError && (
                            <p className="modal-error">
                                {modalError}
                            </p>
                        )}

                        <div className="modal-field">
                            <label htmlFor="forgotEmailInput">Email</label>
                            <input id="forgotEmailInput" type="email" placeholder="Enter your registered email"
                                   value={forgotInput} onChange={(e) => setForgotInput(e.target.value)}/>
                        </div>
                        <button
                            id="btnSendOtp"
                            className="btn-modal-primary"
                            onClick={handleSendOtp}
                            disabled={modalLoading}
                        >
                            {modalLoading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </div>

                    <div className="modal-back-link">
                        <button onClick={closeAllModals}>Back to Login</button>
                    </div>
                </div>
            </div>

            {/* MODAL STEP 2 – VERIFY OTP */}
            <div id="modalOtp" className={`modal-backdrop ${activeModal === 'otp' ? 'show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="titleOtp">
                <div className="modal-card">
                    <button className="modal-close" onClick={closeAllModals} aria-label="Close">&times;</button>

                    <div className="step-dots" aria-hidden="true">
                        <div className="step-dot done"></div>
                        <div className="step-dot active"></div>
                        <div className="step-dot"></div>
                        <div className="step-dot"></div>
                    </div>

                    <div className="modal-icon blue">
                        <span className="material-symbols-outlined">verified</span>
                    </div>

                    <h2 id="titleOtp" className="modal-title">Verify OTP</h2>
                    <p className="modal-subtitle">Enter the 6-digit OTP sent to your registered email.</p>

                    <div className="otp-grid" role="group" aria-label="OTP input">
                        {otpDigits.map((digit, i) => (
                            <input key={i} ref={el => otpRefs.current[i] = el} className="otp-cell" maxLength="1" inputMode="numeric" aria-label={`Digit ${i + 1}`}
                                   value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} onPaste={(e) => handleOtpPaste(i, e)}/>
                        ))}
                    </div>

                    <p className="otp-timer">OTP expires in <span id="otpCountdown" className="countdown">{formatTime(otpCountdown)}</span>
                    </p>
                    {otpError && (
                        <p className="modal-error">
                            {otpError}
                        </p>
                    )}

                    <div className="modal-form" style={{marginTop: '1.5rem'}}>
                       <button
                            id="btnVerifyOtp"
                            className="btn-modal-primary"
                            onClick={handleVerifyOtp}
                            disabled={otpLoading}>
                             {otpLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                            id="btnResendOtp"
                            className="btn-modal-ghost"
                            onClick={handleResendOtp}
                            disabled={resendLoading}>
                            {resendLoading ? 'Sending...' : 'Resend OTP'}
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL STEP 3 – RESET PASSWORD */}
            <div id="modalReset" className={`modal-backdrop ${activeModal === 'reset' ? 'show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="titleReset">
                <div className="modal-card">
                    <button className="modal-close" onClick={closeAllModals} aria-label="Close">&times;</button>

                    <div className="step-dots" aria-hidden="true">
                        <div className="step-dot done"></div>
                        <div className="step-dot done"></div>
                        <div className="step-dot active"></div>
                        <div className="step-dot"></div>
                    </div>

                    <div className="modal-icon blue">
                        <span className="material-symbols-outlined">key</span>
                    </div>

                    <h2 id="titleReset" className="modal-title">Reset Password</h2>
                    <p className="modal-subtitle">Create a strong new password for your EMS account.</p>

                    <div className="modal-form">
                        <div className="modal-field">
                            <label htmlFor="newPasswordInput">New Password</label>
                            <input id="newPasswordInput" type="password" placeholder="Enter new password"
                                   value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                        </div>

                        <div className="modal-field">
                            <label htmlFor="confirmPasswordInput">Confirm Password</label>
                            <input id="confirmPasswordInput" type="password" placeholder="Confirm password"
                                   value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                        </div>

                        <p className="modal-error">
                            {resetError || passwordError}
                        </p>

                        <div className="password-hints">
                            <ul>
                                <li className="hint-item"><span className="hint-dot">•</span> Minimum 8 characters</li>
                                <li className="hint-item"><span className="hint-dot">•</span> Include uppercase letter</li>
                                <li className="hint-item"><span className="hint-dot">•</span> Include number</li>
                                <li className="hint-item"><span className="hint-dot">•</span> Include special character</li>
                            </ul>
                        </div>

                        <button
                            id="btnUpdatePassword"
                            className="btn-modal-primary"
                            onClick={handleUpdatePassword}
                            disabled={resetLoading}>
                            {resetLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL STEP 4 – SUCCESS */}
            <div id="modalSuccess" className={`modal-backdrop ${activeModal === 'success' ? 'show' : ''}`} role="dialog" aria-modal="true" aria-labelledby="titleSuccess">
                <div className="modal-card" style={{textAlign: 'center'}}>

                    <div className="step-dots" aria-hidden="true">
                        <div className="step-dot done"></div>
                        <div className="step-dot done"></div>
                        <div className="step-dot done"></div>
                        <div className="step-dot active"></div>
                    </div>

                    <div className="success-icon-wrap">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>

                    <h2 id="titleSuccess" className="modal-title">Password Updated!</h2>
                    <p className="modal-subtitle">Your password has been successfully updated. You can now sign in with your new credentials.</p>

                    <button id="btnBackToLogin" className="btn-modal-primary green" onClick={closeAllModals}>Back to Login</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
