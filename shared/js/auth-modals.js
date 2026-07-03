/* =============================================
   auth-modals.js – Forgot Password Modal Flow
   Part of HR Pulse EMS Shared Scripts
   ============================================= */

(function () {
    'use strict';

    // ── Helpers ────────────────────────────────
    function showModal(id) {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('active');
            // Focus first focusable element inside
            const first = el.querySelector('input, button:not(.modal-close)');
            if (first) setTimeout(() => first.focus(), 50);
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }

    window.showModal = showModal;
    window.closeAllModals = closeAllModals;

    // ── Close on backdrop click ─────────────────
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-backdrop')) closeAllModals();
    });

    // ── Close on Escape ─────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAllModals();
    });

    // ── Wait for DOM ────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // Forgot password trigger
        const forgotBtn = document.getElementById('forgotBtn');
        if (forgotBtn) {
            forgotBtn.addEventListener('click', function (e) {
                e.preventDefault();
                showModal('modalForgot');
            });
        }

        // ── Step 1 → Step 2 ──────────────────────
        const btnSendOtp = document.getElementById('btnSendOtp');
        if (btnSendOtp) {
            btnSendOtp.addEventListener('click', function () {
                const input = document.getElementById('forgotEmailInput');
                if (!input || !input.value.trim()) {
                    if (input) {
                        input.classList.add('error');
                        input.focus();
                        setTimeout(() => input.classList.remove('error'), 2000);
                    }
                    return;
                }
                showModal('modalOtp');
                startOtpTimer();
            });
        }

        // ── OTP cells: auto-advance, backspace, paste ─
        const otpCells = document.querySelectorAll('.otp-cell');

        otpCells.forEach((cell, idx) => {
            cell.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '').slice(-1);
                this.classList.toggle('filled', !!this.value);
                if (this.value && idx < otpCells.length - 1) otpCells[idx + 1].focus();
            });

            cell.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !this.value && idx > 0) {
                    otpCells[idx - 1].focus();
                    otpCells[idx - 1].value = '';
                    otpCells[idx - 1].classList.remove('filled');
                }
            });

            cell.addEventListener('paste', function (e) {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData)
                    .getData('text').replace(/\D/g, '');
                pasted.split('').forEach((ch, i) => {
                    if (otpCells[idx + i]) {
                        otpCells[idx + i].value = ch;
                        otpCells[idx + i].classList.add('filled');
                    }
                });
                const next = otpCells[Math.min(idx + pasted.length, otpCells.length - 1)];
                if (next) next.focus();
            });
        });

        // ── OTP Timer ────────────────────────────
        let timerInterval = null;

        function startOtpTimer(seconds) {
            seconds = seconds || 300;
            clearInterval(timerInterval);
            const el = document.getElementById('otpCountdown');
            function tick() {
                if (!el) return;
                const m = String(Math.floor(seconds / 60)).padStart(2, '0');
                const s = String(seconds % 60).padStart(2, '0');
                el.textContent = m + ':' + s;
                if (seconds === 0) clearInterval(timerInterval);
                seconds--;
            }
            tick();
            timerInterval = setInterval(tick, 1000);
        }

        window.startOtpTimer = startOtpTimer;

        const btnResend = document.getElementById('btnResendOtp');
        if (btnResend) {
            btnResend.addEventListener('click', function () {
                otpCells.forEach(c => { c.value = ''; c.classList.remove('filled'); });
                if (otpCells[0]) otpCells[0].focus();
                startOtpTimer();
            });
        }

        // ── Step 2 → Step 3 ──────────────────────
        const btnVerify = document.getElementById('btnVerifyOtp');
        if (btnVerify) {
            btnVerify.addEventListener('click', function () {
                const filled = Array.from(otpCells).filter(c => c.value).length;
                if (filled < otpCells.length) {
                    // Highlight empty cells
                    otpCells.forEach(c => {
                        if (!c.value) c.classList.add('error');
                    });
                    if (otpCells[filled]) otpCells[filled].focus();
                    setTimeout(() => otpCells.forEach(c => c.classList.remove('error')), 1500);
                    return;
                }
                showModal('modalReset');
            });
        }

        // ── Password strength indicator ───────────
        const newPassInput = document.getElementById('newPasswordInput');
        if (newPassInput) {
            newPassInput.addEventListener('input', function () {
                const val = this.value;
                const hints = document.querySelectorAll('.hint-item');
                const checks = [
                    val.length >= 8,
                    /[A-Z]/.test(val),
                    /[0-9]/.test(val),
                    /[^A-Za-z0-9]/.test(val)
                ];
                hints.forEach((h, i) => {
                    if (checks[i]) {
                        h.style.color = '#059669';
                        h.querySelector('.hint-dot').textContent = '✓';
                    } else {
                        h.style.color = '';
                        h.querySelector('.hint-dot').textContent = '•';
                    }
                });
            });
        }

        // ── Step 3 → Step 4 ──────────────────────
        const btnUpdate = document.getElementById('btnUpdatePassword');
        if (btnUpdate) {
            btnUpdate.addEventListener('click', function () {
                const np = document.getElementById('newPasswordInput');
                const cp = document.getElementById('confirmPasswordInput');
                const errEl = document.getElementById('passwordError');

                if (errEl) errEl.textContent = '';

                if (!np || np.value.length < 8) {
                    if (errEl) errEl.textContent = 'Password must be at least 8 characters.';
                    if (np) { np.classList.add('error'); np.focus(); setTimeout(() => np.classList.remove('error'), 2000); }
                    return;
                }
                if (!cp || np.value !== cp.value) {
                    if (errEl) errEl.textContent = 'Passwords do not match.';
                    if (cp) { cp.classList.add('error'); cp.focus(); setTimeout(() => cp.classList.remove('error'), 2000); }
                    return;
                }

                showModal('modalSuccess');
            });
        }

        // ── Step 4: Back to Login ─────────────────
        const btnBack = document.getElementById('btnBackToLogin');
        if (btnBack) {
            btnBack.addEventListener('click', function () {
                clearInterval(timerInterval);
                // Reset all state
                const forgotInput = document.getElementById('forgotEmailInput');
                if (forgotInput) forgotInput.value = '';
                otpCells.forEach(c => { c.value = ''; c.classList.remove('filled'); });
                const newP = document.getElementById('newPasswordInput');
                const confP = document.getElementById('confirmPasswordInput');
                const errEl = document.getElementById('passwordError');
                if (newP) newP.value = '';
                if (confP) confP.value = '';
                if (errEl) errEl.textContent = '';
                closeAllModals();
            });
        }

    }); // DOMContentLoaded

})();
