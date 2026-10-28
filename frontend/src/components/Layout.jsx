import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_MAP } from '../lib/constants';
import { Avatar } from './ui';

const navItems = [
  { to: '/destinations', label: 'Destinations' },
  { to: '/plan', label: 'Plan a trip' },
  { to: '/services', label: 'Find services' }
];

const Header = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="TravelMate home">
          <span className="brand-mark"><Compass size={23} strokeWidth={2.2} /></span>
          <span>Travel<span>Mate</span></span>
        </Link>

        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
          <a href="/#how-it-works">How it works</a>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link to={`/dashboard/${user.role}`} className="user-chip" title={`${ROLE_MAP[user.role]?.label} dashboard`}>
                <Avatar user={user} size={32} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button type="button" className="icon-button desktop-only" onClick={handleLogout} title="Sign out">
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-small">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-small">Get started <ArrowRight size={15} /></Link>
            </>
          )}
          <button
            type="button"
            className="icon-button menu-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <span className="menu-lines" aria-hidden="true"><i /><i /><i /></span>}
          </button>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand">
        <Link to="/" className="brand">
          <span className="brand-mark"><Compass size={22} /></span>
          <span>Travel<span>Mate</span></span>
        </Link>
        <p>Plan India your way — with transparent estimates and trusted local guides, transport and stays.</p>
        <div className="footer-badges">
          <span>Made for India</span>
          <span>MongoDB powered</span>
        </div>
      </div>
      <div>
        <h4>Explore</h4>
        <Link to="/destinations">Destinations</Link>
        <Link to="/plan">Trip cost estimator</Link>
        <Link to="/services">Travel services</Link>
        <Link to="/register">Create an account</Link>
      </div>
      <div>
        <h4>Dashboards</h4>
        <Link to="/dashboard/traveller">Traveller</Link>
        <Link to="/dashboard/guide">Travel guide</Link>
        <Link to="/dashboard/transport">Transport agency</Link>
        <Link to="/dashboard/hotel">Hotel</Link>
      </div>
      <div>
        <h4>Project</h4>
        <a href="/images/CREDITS.md" target="_blank" rel="noreferrer">Image credits</a>
        <a href="/api/meta" target="_blank" rel="noreferrer">API metadata</a>
        <span>React · Express · MongoDB</span>
        <span>Indicative prices in INR</span>
      </div>
    </div>
    <div className="container footer-bottom">
      <span>© {new Date().getFullYear()} TravelMate. Built as a full-stack MVC prototype.</span>
      <span>Photography: Wikimedia Commons contributors · <a href="/images/CREDITS.md" target="_blank" rel="noreferrer">attribution</a></span>
    </div>
  </footer>
);

const Layout = ({ children }) => (
  <div className="app-shell">
    <Header />
    <main>{children}</main>
    <Footer />
  </div>
);

export default Layout;
