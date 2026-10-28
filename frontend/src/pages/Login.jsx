import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, ROLE_MAP } from '../lib/constants';
import { InlineNotice, Spinner } from '../components/ui';

const Login = () => {
  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const redirect = location.state?.from?.pathname;
      navigate(redirect || `/dashboard/${user.role}`, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (email) => {
    setForm({ email, password: DEMO_PASSWORD });
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-aside">
        <div className="auth-aside-content">
          <Link to="/" className="brand brand-light">
            <span className="brand-mark"><Compass size={22} /></span>
            <span>Travel<span>Mate</span></span>
          </Link>
          <h2>Pick up where your last journey left off.</h2>
          <p>Your saved plans, bookings and provider requests live in one dashboard, backed by MongoDB.</p>
          <div className="auth-quote">
            <img src="/images/places/hawa-mahal.jpg" alt="Hawa Mahal, Jaipur" />
            <blockquote>“The estimate showed exactly what a four-day Jaipur trip would cost — then I booked a guide in two clicks.”</blockquote>
            <span>Ananya, weekend traveller</span>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <Link to="/" className="auth-home"><Compass size={16} /> TravelMate home</Link>
        <div className="auth-card">
          <span className="eyebrow"><Sparkles size={15} /> Welcome back</span>
          <h1>Sign in to TravelMate</h1>
          <p className="auth-sub">Use your traveller, guide, transport or hotel account.</p>

          {error && <InlineNotice type="error">{error}</InlineNotice>}

          <form onSubmit={submit} className="auth-form">
            <label className="field">
              <span><Mail size={15} /> Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              <span><LockKeyhole size={15} /> Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(event) => setForm((c) => ({ ...c, password: event.target.value }))}
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading}>
              {loading ? <><Spinner size={17} /> Signing in...</> : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-switch">New to TravelMate? <Link to="/register">Create an account</Link></p>

          <div className="demo-box">
            <div className="demo-box-head">
              <strong>Try a demo account</strong>
              <span>password {DEMO_PASSWORD}</span>
            </div>
            <div className="demo-grid">
              {DEMO_ACCOUNTS.map((account) => (
                <button type="button" key={account.role} onClick={() => useDemo(account.email)}>
                  <span className={`demo-dot demo-${ROLE_MAP[account.role]?.color}`} />
                  <span>{account.label}<small>{account.email}</small></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
