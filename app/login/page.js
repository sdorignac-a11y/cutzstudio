'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const PANEL_PATH = '/panel';

function ArmchairIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 11V7.7A3.7 3.7 0 0 1 10.7 4h2.6A3.7 3.7 0 0 1 17 7.7V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M5.5 10.5A2.5 2.5 0 0 0 3 13v3.2A2.8 2.8 0 0 0 5.8 19h12.4a2.8 2.8 0 0 0 2.8-2.8V13a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 16 13v1H8v-1a2.5 2.5 0 0 0-2.5-2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M6 19v1.5M18 19v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14.2v2.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ hidden = false }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3 21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.1 5.3A10.8 10.8 0 0 1 12 4.9c5.1 0 8.6 4.5 9.3 5.5a2.7 2.7 0 0 1 0 3.2 15 15 0 0 1-2.1 2.4M6.2 6.2A15.3 15.3 0 0 0 2.7 10.4a2.7 2.7 0 0 0 0 3.2c.7 1 4.2 5.5 9.3 5.5 1.3 0 2.5-.3 3.5-.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.7 10.4C3.4 9.4 6.9 4.9 12 4.9s8.6 4.5 9.3 5.5a2.7 2.7 0 0 1 0 3.2c-.7 1-4.2 5.5-9.3 5.5s-8.6-4.5-9.3-5.5a2.7 2.7 0 0 1 0-3.2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function friendlyAuthError(message = '') {
  const value = message.toLowerCase();

  if (value.includes('invalid login credentials')) {
    return 'El correo o la contraseña no son correctos.';
  }
  if (value.includes('email not confirmed')) {
    return 'Primero confirmá tu correo electrónico.';
  }
  if (value.includes('too many requests')) {
    return 'Hubo demasiados intentos. Esperá unos minutos y volvé a probar.';
  }
  if (value.includes('user already registered')) {
    return 'Ya existe una cuenta con ese correo — probá iniciar sesión.';
  }

  return 'Revisá tus datos e intentá nuevamente.';
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const action =
        mode === 'signin'
          ? supabase.auth.signInWithPassword({ email: email.trim(), password })
          : supabase.auth.signUp({ email: email.trim(), password });

      const { error: authError } = await action;

      if (authError) {
        setError(friendlyAuthError(authError.message));
        return;
      }

      if (mode === 'signup') {
        setInfoMessage('Cuenta creada. Si tu proyecto pide confirmación por email, revisá tu correo antes de entrar.');
        return;
      }

      if (!remember) {
        sessionStorage.setItem('reality-session-only', 'true');
      } else {
        sessionStorage.removeItem('reality-session-only');
      }

      router.push(PANEL_PATH);
      router.refresh();
    } catch {
      setError('Ocurrió un error inesperado. Volvé a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
    setError('');
    setInfoMessage('');
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <main className="login-page">
        <div className="background-shape background-shape-left" />
        <div className="background-shape background-shape-right" />

        <section className="login-card" aria-label="Iniciar sesión en Reality">
          <div className="visual-panel" aria-hidden="true" />

          <div className="form-panel">
            <div className="mobile-brand">
              <span className="brand-icon"><ArmchairIcon /></span>
              <span>Reality</span>
            </div>

            <div className="form-content">
              <header className="form-header">
                <h1>{mode === 'signin' ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}</h1>
                <p>{mode === 'signin' ? 'Iniciá sesión para continuar' : 'Sumate como mueblería'}</p>
              </header>

              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label htmlFor="email">Correo electrónico</label>
                  <div className="input-wrap">
                    <span className="input-icon"><MailIcon /></span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field password-field">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrap">
                    <span className="input-icon"><LockIcon /></span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="••••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
                      required
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <EyeIcon hidden={showPassword} />
                    </button>
                  </div>
                </div>

                {mode === 'signin' && (
                  <div className="options-row">
                    <label className="remember-control">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                      />
                      <span className="custom-checkbox" aria-hidden="true">
                        <svg viewBox="0 0 16 16">
                          <path d="m3.2 8.2 3 3 6.5-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      Recordarme
                    </label>
                  </div>
                )}

                {error && (
                  <div className="error-message" role="alert">
                    {error}
                  </div>
                )}

                {infoMessage && (
                  <div className="info-message" role="status">
                    {infoMessage}
                  </div>
                )}

                <button className="primary-button" type="submit" disabled={loading}>
                  <span>
                    {loading
                      ? 'Un momento…'
                      : mode === 'signin'
                        ? 'Iniciar sesión'
                        : 'Crear cuenta'}
                  </span>
                  <span className="button-arrow"><ArrowIcon /></span>
                </button>
              </form>

              <p className="register-copy">
                {mode === 'signin' ? (
                  <>¿No tenés cuenta? <button type="button" className="link-button" onClick={toggleMode}>Crear cuenta</button></>
                ) : (
                  <>¿Ya tenés cuenta? <button type="button" className="link-button" onClick={toggleMode}>Iniciar sesión</button></>
                )}
              </p>
            </div>
          </div>
        </section>

        <Link href="/" className="back-home">
          Volver al sitio
        </Link>
      </main>

      <style>{`
        :root {
          --blue-900: #153a78;
          --blue-800: #174ea9;
          --blue-700: #1269f3;
          --blue-600: #2c82f6;
          --blue-200: #d9eaff;
          --blue-100: #edf6ff;
          --navy: #17356d;
          --text: #526b98;
          --muted: #8496b7;
          --white: #ffffff;
          --border: #d7e2f3;
          --danger: #d94b5b;
          --success: #2f7a4d;
          --shadow: 0 28px 80px rgba(34, 82, 158, 0.18);
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
        }

        body {
          font-family: "Nunito", sans-serif;
          color: var(--text);
          background: #f8fbff;
        }

        button,
        input {
          font: inherit;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .link-button {
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          color: var(--blue-700);
          font-weight: 850;
          font: inherit;
        }

        .link-button:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .login-page {
          position: relative;
          min-height: 100svh;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: 32px 24px 50px;
          background:
            radial-gradient(circle at 29% 11%, rgba(217, 234, 255, 0.72), transparent 26%),
            radial-gradient(circle at 75% 76%, rgba(220, 236, 255, 0.48), transparent 31%),
            linear-gradient(135deg, #fbfdff 0%, #f5f9ff 46%, #ffffff 100%);
        }

        .background-shape {
          position: absolute;
          pointer-events: none;
          background: linear-gradient(145deg, rgba(213, 232, 255, 0.92), rgba(231, 242, 255, 0.62));
          filter: blur(0.2px);
        }

        .background-shape-left {
          top: -110px;
          left: -120px;
          width: 310px;
          height: 390px;
          border-radius: 45% 55% 56% 44% / 37% 35% 65% 63%;
          transform: rotate(18deg);
        }

        .background-shape-right {
          right: -150px;
          bottom: -185px;
          width: 360px;
          height: 430px;
          border-radius: 64% 36% 38% 62% / 52% 50% 50% 48%;
          transform: rotate(-15deg);
        }

        .login-card {
          position: relative;
          z-index: 2;
          width: min(1148px, calc(100vw - 48px));
          height: min(806px, calc(100svh - 76px));
          min-height: 670px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid rgba(35, 105, 221, 0.08);
          border-radius: 34px;
          background: var(--white);
          box-shadow: var(--shadow);
        }

        .visual-panel {
          min-width: 0;
          background:
            url("/reality-login-visual.png")
            center center / 100% 100%
            no-repeat;
        }

        .form-panel {
          position: relative;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 50px 58px;
          background:
            radial-gradient(circle at 55% 8%, rgba(255, 255, 255, 0.95), transparent 32%),
            linear-gradient(180deg, #ffffff 0%, #fefeff 100%);
        }

        .form-content {
          width: min(100%, 390px);
        }

        .form-header {
          margin-bottom: 42px;
          text-align: center;
        }

        .form-header h1 {
          margin: 0 0 8px;
          color: var(--navy);
          font-family: "Baloo 2", sans-serif;
          font-size: clamp(2rem, 3vw, 2.45rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.025em;
        }

        .form-header p {
          margin: 0;
          color: #6179a4;
          font-size: 1rem;
          font-weight: 600;
        }

        .field {
          display: grid;
          gap: 9px;
          margin-bottom: 25px;
        }

        .field label {
          color: #294a80;
          font-size: 0.94rem;
          font-weight: 800;
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap input {
          width: 100%;
          height: 57px;
          padding: 0 54px 0 50px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          outline: none;
          color: var(--navy);
          background: rgba(255, 255, 255, 0.96);
          font-size: 0.97rem;
          font-weight: 650;
          box-shadow: 0 4px 14px rgba(48, 87, 144, 0.025);
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .input-wrap input::placeholder {
          color: #a4b2cb;
          font-weight: 600;
        }

        .input-wrap input:focus {
          border-color: #74aefc;
          box-shadow: 0 0 0 4px rgba(45, 124, 242, 0.1);
        }

        .input-icon {
          position: absolute;
          z-index: 2;
          top: 50%;
          left: 17px;
          width: 21px;
          height: 21px;
          color: #7287ad;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .input-icon svg,
        .password-toggle svg,
        .button-arrow svg,
        .brand-icon svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 14px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          padding: 7px;
          border: 0;
          border-radius: 10px;
          color: #6681b0;
          background: transparent;
          cursor: pointer;
          transform: translateY(-50%);
          transition: background 0.2s ease, color 0.2s ease;
        }

        .password-toggle:hover {
          color: var(--blue-700);
          background: var(--blue-100);
        }

        .options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin: -5px 0 30px;
          font-size: 0.85rem;
          font-weight: 750;
        }

        .remember-control {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #61759d;
          cursor: pointer;
          user-select: none;
        }

        .remember-control input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .custom-checkbox {
          width: 19px;
          height: 19px;
          display: grid;
          place-items: center;
          border: 1.5px solid #b4c4dc;
          border-radius: 6px;
          color: transparent;
          background: #ffffff;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .custom-checkbox svg {
          width: 13px;
          height: 13px;
        }

        .remember-control input:checked + .custom-checkbox {
          border-color: var(--blue-700);
          color: #ffffff;
          background: var(--blue-700);
        }

        .remember-control input:focus-visible + .custom-checkbox {
          box-shadow: 0 0 0 4px rgba(45, 124, 242, 0.13);
        }

        .error-message,
        .info-message {
          margin: -12px 0 18px;
          padding: 11px 13px;
          border-radius: 11px;
          font-size: 0.82rem;
          font-weight: 750;
          text-align: center;
        }

        .error-message {
          border: 1px solid rgba(217, 75, 91, 0.16);
          color: var(--danger);
          background: rgba(255, 243, 245, 0.86);
        }

        .info-message {
          border: 1px solid rgba(47, 122, 77, 0.18);
          color: var(--success);
          background: rgba(240, 250, 244, 0.9);
        }

        .primary-button {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          font-weight: 850;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 64px;
          border: 0;
          color: #ffffff;
          background: linear-gradient(180deg, #3088f8 0%, #0f63ed 68%, #0759dc 100%);
          box-shadow: 0 13px 24px rgba(19, 103, 232, 0.28);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 17px 30px rgba(19, 103, 232, 0.34);
        }

        .button-arrow {
          position: absolute;
          top: 50%;
          right: 14px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          padding: 8px;
          border-radius: 50%;
          color: var(--blue-700);
          background: #ffffff;
          box-shadow: 0 6px 14px rgba(5, 70, 175, 0.17);
          transform: translateY(-50%);
        }

        .primary-button:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .register-copy {
          margin: 40px 0 0;
          color: #61759d;
          font-size: 0.9rem;
          font-weight: 700;
          text-align: center;
        }

        .mobile-brand {
          display: none;
        }

        .back-home {
          position: absolute;
          z-index: 4;
          right: 28px;
          bottom: 20px;
          color: #6e84aa;
          font-size: 0.8rem;
          font-weight: 800;
        }

        .back-home:hover {
          color: var(--blue-700);
        }

        @media (max-height: 790px) and (min-width: 861px) {
          .login-card {
            min-height: 650px;
          }

          .form-panel {
            padding-top: 34px;
            padding-bottom: 34px;
          }

          .form-header {
            margin-bottom: 28px;
          }

          .field {
            margin-bottom: 19px;
          }

          .register-copy {
            margin-top: 28px;
          }
        }

        @media (max-width: 860px) {
          .login-page {
            overflow-y: auto;
            padding: 24px 16px 44px;
          }

          .login-card {
            width: min(520px, 100%);
            height: auto;
            min-height: 0;
            grid-template-columns: 1fr;
            border-radius: 28px;
          }

          .visual-panel {
            display: none;
          }

          .form-panel {
            min-height: 690px;
            padding: 38px 30px;
          }

          .mobile-brand {
            position: absolute;
            top: 24px;
            left: 28px;
            display: flex;
            align-items: center;
            gap: 9px;
            color: var(--blue-700);
            font-family: "Baloo 2", sans-serif;
            font-size: 1.55rem;
            font-weight: 800;
          }

          .brand-icon {
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            padding: 6px;
            border: 2px solid currentColor;
            border-radius: 12px;
          }

          .form-content {
            margin-top: 50px;
          }

          .back-home {
            position: static;
            z-index: 2;
            margin-top: 18px;
          }
        }

        @media (max-width: 480px) {
          .login-page {
            place-items: start center;
            padding-inline: 11px;
          }

          .login-card {
            border-radius: 23px;
          }

          .form-panel {
            min-height: 650px;
            padding: 34px 20px 30px;
          }

          .mobile-brand {
            top: 20px;
            left: 21px;
          }

          .form-header {
            margin-bottom: 32px;
          }

          .form-header h1 {
            font-size: 2rem;
          }

          .options-row {
            align-items: flex-start;
            font-size: 0.78rem;
          }

          .input-wrap input {
            height: 54px;
          }

          .primary-button {
            height: 54px;
          }
        }
      `}</style>
    </>
  );
}
