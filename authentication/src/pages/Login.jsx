import { useState } from 'react';
import '../assets/styles/login.css';
import '../assets/styles/auth-modals.css';
import { login, saveAuth, buildRedirectUrl } from '../services/authService.js';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    // Which modal is currently shown: null | 'forgot' | 'otp' | 'reset' | 'success'
    const [activeModal, setActiveModal] = useState(null);

    const [forgotInput, setForgotInput] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    function closeAllModals() {
        setActiveModal(null);
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
            saveAuth(data);

            if (data.redirectUrl) {
                window.location.href = buildRedirectUrl(data);
            } else {
                // redirectToDashboard(data.role) was defined in shared utils.js,
                // which was not provided. Falling back to root.
                window.location.href = '/';
            }
        } catch (err) {
            setLoginError(err.message);
            setPassword('');
        } finally {
            setLoading(false);
        }
    }

    function handleOtpChange(index, value) {
        if (value.length > 1) return;
        const next = [...otpDigits];
        next[index] = value;
        setOtpDigits(next);
    }

    function handleUpdatePassword() {
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }
        setPasswordError('');
        setActiveModal('success');
    }

    return (
        <div className="font-body-md text-on-surface antialiased">
            <div className="flex min-h-screen">

                {/* ── Left: Branding Panel ── */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
                    <img className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                         src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRK7nwwgv39gTypr5_mo1gy-m7m6UMxXDYXmJ0HqBn4I-iC8X4Euo_hcs2vibj5xTB1VoOLqV3gszb-MvdvjNjNQ1_Ark8AUo06Wfaf6ZOL71wQDiSaeinKwVoKpYmbHgoba64XjezaDFs5iguYVOQwAxiJlhmFdKbrBx0DPfvdkQjpFNuSm9VNgCWv124t9uAYM1_d8M9AO1d8U-rf_y9D78w1iakIcvJeSB2u3UtINYRgm_XctzGZfGQ9RuxAksTQSBZJSzT-1E"
                         alt="team collaborating"/>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-blue-800/60"></div>

                    <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-white text-[32px]" style={{fontVariationSettings: "'FILL' 1"}}>pulse_alert</span>
                            <span className="font-bold text-3xl text-white tracking-tight">HR Pulse</span>
                        </div>
                        <div className="max-w-md">
                            <h1 className="text-4xl font-bold text-white leading-tight mb-6">
                                Empowering teams with intelligent workplace solutions.
                            </h1>
                            <p className="text-lg text-blue-100">
                                Streamline your HR operations, payroll, and performance tracking in one unified enterprise platform.
                            </p>
                        </div>
                        <p className="text-sm text-blue-100 uppercase tracking-widest">Trusted by 500+ global enterprises</p>
                    </div>
                </div>

                {/* ── Right: Login Form ── */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
                    <div className="w-full max-w-[440px]">

                        <div className="mb-10">
                            <div className="lg:hidden flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>pulse_alert</span>
                                <span className="font-bold text-3xl text-primary tracking-tight">HR Pulse</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-slate-500">Please enter your credentials to access your dashboard.</p>
                        </div>

                        <form id="loginForm" className="space-y-8" onSubmit={handleSubmit}>
                            {loginError && (
                                <div id="loginError" style={{
                                    display: 'block',
                                    color: '#dc2626',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    fontSize: '14px',
                                    marginBottom: '12px',
                                    whiteSpace: 'pre-line'
                                }}>
                                    {loginError}
                                </div>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block font-medium" htmlFor="email">Work Email</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                                    <input id="email" type="email"
                                           className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                           placeholder="name@company.com" required
                                           value={email}
                                           onChange={(e) => setEmail(e.target.value)}/>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block font-medium" htmlFor="password">Password</label>
                                    <a href="#" id="forgotBtn" className="text-primary hover:underline text-sm"
                                       onClick={(e) => { e.preventDefault(); setActiveModal('forgot'); }}>Forgot password?</a>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                                    <input id="password" type={showPassword ? 'text' : 'password'}
                                           className="w-full pl-12 pr-14 py-4 rounded-2xl border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                           placeholder="••••••••" required autoComplete="current-password"
                                           value={password}
                                           onChange={(e) => setPassword(e.target.value)}/>
                                    <button type="button" id="togglePassword"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'} title="Show password"
                                            onClick={() => setShowPassword(!showPassword)}>
                                        <span id="togglePasswordIcon" className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
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

                        <p className="mt-6 text-center text-xs text-slate-400">
                            Demo: <span className="font-medium">admin@company.com</span> / <span className="font-medium">Admin@123</span>
                            (also hr@, manager@, arun@company.com)
                        </p>

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
                        <div className="modal-field">
                            <label htmlFor="forgotEmailInput">Email or Employee ID</label>
                            <input id="forgotEmailInput" type="text" placeholder="Enter email or employee ID"
                                   value={forgotInput} onChange={(e) => setForgotInput(e.target.value)}/>
                        </div>
                        <button id="btnSendOtp" className="btn-modal-primary" onClick={() => setActiveModal('otp')}>Send OTP</button>
                    </div>

                    <div className="modal-back-link">
                        <button onClick={closeAllModals}>Back to Login</button>
                    </div>
                </div>
            </div>

            {/* MODAL STEP 2 – VERIFY OTP  */}
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
                            <input key={i} className="otp-cell" maxLength="1" inputMode="numeric" aria-label={`Digit ${i + 1}`}
                                   value={digit} onChange={(e) => handleOtpChange(i, e.target.value)}/>
                        ))}
                    </div>

                    <p className="otp-timer">OTP expires in <span id="otpCountdown" className="countdown">05:00</span></p>

                    <div className="modal-form" style={{marginTop: '1.5rem'}}>
                        <button id="btnVerifyOtp" className="btn-modal-primary" onClick={() => setActiveModal('reset')}>Verify OTP</button>
                        <button id="btnResendOtp" className="btn-modal-ghost">Resend OTP</button>
                    </div>
                </div>
            </div>

            {/*MODAL STEP 3 – RESET PASSWORD */}
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

                        <p id="passwordError" className="modal-error">{passwordError}</p>

                        <div className="password-hints">
                            <ul>
                                <li className="hint-item"><span className="hint-dot">•</span> Minimum 8 characters</li>
                                <li className="hint-item"><span className="hint-dot">•</span> Include uppercase letter</li>
                                <li className="hint-item"><span className="hint-dot">•</span> Include number</li>
                                <li className="hint-item"><span className="hint-dot">•</span> Include special character</li>
                            </ul>
                        </div>

                        <button id="btnUpdatePassword" className="btn-modal-primary" onClick={handleUpdatePassword}>Update Password</button>
                    </div>
                </div>
            </div>

            {/*  MODAL STEP 4 – SUCCESS*/}
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
