import React, { useEffect, useState } from 'react';
import { loginUser, registerUser, getDepartments } from '../services/api';

const FALLBACK_DEPARTMENTS = [
  { id: 1, name: 'IT Support & Operations' },
  { id: 2, name: 'Engineering' },
  { id: 3, name: 'Human Resources' },
  { id: 4, name: 'Finance & Administration' },
  { id: 5, name: 'Sales & Customer Success' },
];

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Create Account state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getDepartments()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data)
          ? data
          : data?.content || data?.departments || [];
        if (Array.isArray(list) && list.length > 0) {
          setDepartments(list);
        }
      })
      .catch(() => {
        // Fall back to static department list if /api/departments isn't exposed yet
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setLoginError('');
    setRegError('');
    setRegSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail || !loginPassword) {
      setLoginError('Please enter both your email address and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const userData = await loginUser({
        email: trimmedEmail,
        password: loginPassword,
      });
      onAuthenticated?.(userData);
    } catch (err) {
      setLoginError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const trimmedName = fullName.trim();
    const trimmedEmail = regEmail.trim().toLowerCase();

    if (!trimmedName) {
      setRegError('Full name is required.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    const payload = {
      fullName: trimmedName,
      email: trimmedEmail,
      password: regPassword,
      departmentId: departmentId ? Number(departmentId) : null,
    };

    setRegLoading(true);
    try {
      const created = await registerUser(payload);

      setFullName('');
      setRegEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setDepartmentId('');

      setLoginEmail(trimmedEmail);
      setLoginPassword('');
      setMode('login');
      setRegSuccess(
        created?.message || 'Registration successful. You can now sign in with your new account.'
      );
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>ITSM & Asset Governance</div>
          <h1 style={styles.brand}>ServiceSphere</h1>
          <p style={styles.subtitle}>
            {mode === 'login'
              ? 'Sign in to access your workspace, tickets, and assets'
              : 'Register a new employee account to get started'}
          </p>
        </div>

        <div style={styles.tabs} role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => switchMode('login')}
            style={{
              ...styles.tab,
              ...(mode === 'login' ? styles.activeTab : {}),
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => switchMode('register')}
            style={{
              ...styles.tab,
              ...(mode === 'register' ? styles.activeTab : {}),
            }}
          >
            Create Account
          </button>
        </div>

        {regSuccess && mode === 'login' && (
          <div style={styles.successBox} role="status">
            {regSuccess}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={styles.form} noValidate>
            {loginError && (
              <div style={styles.errorBox} role="alert">
                {loginError}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label} htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@company.com"
                style={styles.input}
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                ...styles.primaryBtn,
                ...(loginLoading ? styles.disabledBtn : {}),
              }}
            >
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <p style={styles.footerText}>
              New to ServiceSphere?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={styles.linkBtn}
              >
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={styles.form} noValidate>
            {regError && (
              <div style={styles.errorBox} role="alert">
                {regError}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-fullname">
                Full Name <span style={styles.requiredStar}>*</span>
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                style={styles.input}
                autoComplete="name"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-email">
                Email Address <span style={styles.requiredStar}>*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@company.com"
                style={styles.input}
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-department">
                Department <span style={styles.optionalText}>(Optional)</span>
              </label>
              <select
                id="reg-department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                style={styles.input}
              >
                <option value="">-- Select Department (Optional) --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name || dept.departmentName || `Department #${dept.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-password">
                Password <span style={styles.requiredStar}>*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={styles.input}
                autoComplete="new-password"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="reg-confirm-password">
                Confirm Password <span style={styles.requiredStar}>*</span>
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                style={styles.input}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={regLoading}
              style={{
                ...styles.primaryBtn,
                ...(regLoading ? styles.disabledBtn : {}),
              }}
            >
              {regLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p style={styles.footerText}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={styles.linkBtn}
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#0f172a',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '28px',
    color: '#f8fafc',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  },
  header: {
    marginBottom: '20px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.28)',
    borderRadius: '999px',
    padding: '4px 10px',
    marginBottom: '10px',
  },
  brand: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#f8fafc',
  },
  subtitle: {
    margin: '6px 0 0',
    fontSize: '14px',
    lineHeight: 1.45,
    color: '#94a3b8',
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    backgroundColor: '#0f172a',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #334155',
    marginBottom: '18px',
  },
  tab: {
    padding: '9px 12px',
    border: 'none',
    borderRadius: '7px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  activeTab: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  requiredStar: {
    color: '#f87171',
  },
  optionalText: {
    fontWeight: 400,
    fontSize: '12px',
    color: '#94a3b8',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
  },
  primaryBtn: {
    marginTop: '4px',
    padding: '11px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  disabledBtn: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },
  errorBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.45)',
    color: '#fca5a5',
    fontSize: '13px',
    lineHeight: 1.4,
  },
  successBox: {
    marginBottom: '14px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    border: '1px solid rgba(34, 197, 94, 0.45)',
    color: '#86efac',
    fontSize: '13px',
    lineHeight: 1.4,
  },
  footerText: {
    margin: '4px 0 0',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#38bdf8',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};