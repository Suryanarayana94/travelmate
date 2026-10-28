import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BedDouble, CarFront, Compass, LockKeyhole, Mail, Phone, Route, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../lib/constants';
import { InlineNotice, Spinner } from '../components/ui';

const roleIcons = { traveller: Compass, guide: Route, transport: CarFront, hotel: BedDouble };

const Register = () => {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const initialRole = useMemo(() => {
    const role = searchParams.get('role');
    return ROLES.some((item) => item.value === role) ? role : 'traveller';
  }, [searchParams]);

  const [form, setForm] = useState({
    role: initialRole,
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters long.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const user = await register({
        role: form.role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password
      });
      success('Account created. Welcome to TravelMate!');
      navigate(`/dashboard/${user.role}`, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((role) => role.value === form.role);

  return (
    <div className="auth-page">
      <div className="auth-aside auth-aside-register">
        <div className="auth-aside-content">
          <Link to="/" className="brand brand-light">
            <span className="brand-mark"><Compass size={22} /></span>
            <span>Travel<span>Mate</span></span>
          </Link>
          <h2>One account. The dashboard that fits you.</h2>
          <p>Whether you travel, guide, drive or host — TravelMate gives you the right tools and a direct line to the other side.</p>
          <ul className="auth-benefits">
            <li><Sparkles size={16} /> Transparent, itemised trip estimates</li>
            <li><Sparkles size={16} /> Photographed famous places for every destination</li>
            <li><Sparkles size={16} /> Direct booking requests, no middlemen</li>
            <li><Sparkles size={16} /> Editable profile with photo, phone and email</li>
          </ul>
        </div>
      </div>

      <div className="auth-main">
        <Link to="/" className="auth-home"><Compass size={16} /> TravelMate home</Link>
        <div className="auth-card auth-card-wide">
          <span className="eyebrow"><Sparkles size={15} /> Create your account</span>
          <h1>Join TravelMate</h1>
          <p className="auth-sub">Pick your role — each dashboard is built for a different side of the journey.</p>

          <div className="role-picker">
            {ROLES.map((role) => {
              const Icon = roleIcons[role.value];
              return (
                <button
                  type="button"
                  key={role.value}
                  className={`role-option role-${role.color} ${form.role === role.value ? 'active' : ''}`}
                  onClick={() => setField('role', role.value)}
                  aria-pressed={form.role === role.value}
                >
                  <Icon size={20} />
                  <strong>{role.label}</strong>
                  <small>{role.short}</small>
                </button>
              );
            })}
          </div>
          <p className="role-helper">{selectedRole?.description}</p>

          {error && <InlineNotice type="error">{error}</InlineNotice>}

          <form className="auth-form" onSubmit={submit}>
            <div className="field-grid">
              <label className="field">
                <span><UserRound size={15} /> Full name / business name</span>
                <input required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Aarav Sharma" />
              </label>
              <label className="field">
                <span><Phone size={15} /> Phone</span>
                <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 98765 43210" />
              </label>
            </div>
            <div className="field-grid">
              <label className="field">
                <span><Mail size={15} /> Email address</span>
                <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@example.com" />
              </label>
              <label className="field">
                <span><Compass size={15} /> Base city</span>
                <input value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="Hyderabad" />
              </label>
            </div>
            <div className="field-grid">
              <label className="field">
                <span><LockKeyhole size={15} /> Password</span>
                <input type="password" required autoComplete="new-password" value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder="At least 8 characters" />
              </label>
              <label className="field">
                <span><LockKeyhole size={15} /> Confirm password</span>
                <input type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} placeholder="Repeat password" />
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading}>
              {loading ? <><Spinner size={17} /> Creating account...</> : <>Create account <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
