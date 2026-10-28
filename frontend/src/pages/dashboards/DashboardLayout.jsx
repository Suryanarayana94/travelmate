import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  BriefcaseBusiness,
  CalendarCheck,
  CarFront,
  Compass,
  LayoutDashboard,
  LogOut,
  Map,
  Route,
  Search,
  Settings,
  Sparkles,
  UserRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_MAP } from '../../lib/constants';
import { Avatar } from '../../components/ui';

const roleIcons = { traveller: Compass, guide: Route, transport: CarFront, hotel: BedDouble };

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = ROLE_MAP[user.role];
  const RoleIcon = roleIcons[user.role] || Compass;
  const isTraveller = user.role === 'traveller';

  const links = [
    { to: `/dashboard/${user.role}`, label: 'Overview', icon: LayoutDashboard, end: true },
    isTraveller
      ? { to: '/dashboard/bookings', label: 'My bookings', icon: CalendarCheck }
      : { to: '/dashboard/services', label: 'My services', icon: BriefcaseBusiness },
    isTraveller
      ? { to: '/plan', label: 'Plan a trip', icon: Map }
      : { to: '/dashboard/bookings', label: 'Booking requests', icon: CalendarCheck },
    { to: '/dashboard/profile', label: 'Profile & settings', icon: Settings },
    { to: '/services', label: 'Browse marketplace', icon: Search }
  ];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="brand-mark"><Compass size={20} /></span>
          <span>Travel<span>Mate</span></span>
        </Link>

        <div className={`role-chip role-chip-${role.color}`}>
          <RoleIcon size={17} />
          <div>
            <strong>{role.label}</strong>
            <small>Dashboard</small>
          </div>
        </div>

        <nav className="dashboard-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={`${link.to}-${link.label}`}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <Avatar user={user} size={42} />
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <div className="completion">
            <span style={{ width: `${user.profileCompletion || 0}%` }} />
          </div>
          <small className="completion-label">{user.profileCompletion || 0}% profile complete</small>
        </div>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link"><ArrowLeft size={16} /> <span>Back to TravelMate</span></Link>
          <button type="button" className="sidebar-link" onClick={logout}><LogOut size={16} /> <span>Sign out</span></button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow"><Sparkles size={14} /> {role.label} workspace</span>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
          </div>
          <div className="topbar-actions">
            <Link to="/dashboard/profile" className="btn btn-outline btn-small"><UserRound size={15} /> Edit profile</Link>
            <Link to={`/dashboard/${user.role}`} className="topbar-avatar" aria-label="Dashboard home">
              <Avatar user={user} size={38} />
            </Link>
          </div>
        </header>
        <div className="dashboard-content" key={location.pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const Redirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? `/dashboard/${user.role}` : '/'} replace />;
};

DashboardLayout.Redirect = Redirect;

export default DashboardLayout;
