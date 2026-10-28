import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  BriefcaseBusiness,
  BusFront,
  CalendarCheck,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CloudSun,
  Compass,
  ExternalLink,
  Fuel,
  Globe2,
  Heart,
  IndianRupee,
  Info,
  Landmark,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageSquareText,
  Mountain,
  Navigation,
  Pencil,
  Phone,
  Plane,
  Plus,
  Route,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  TrainFront,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
  Utensils,
  Building2
} from 'lucide-react';
import { formatCurrency, initials } from '../lib/format';

const iconMap = {
  arrowRight: ArrowRight,
  badge: BadgeCheck,
  bed: BedDouble,
  briefcase: BriefcaseBusiness,
  bus: BusFront,
  building: Building2,
  calendar: CalendarDays,
  calendarCheck: CalendarCheck,
  car: CarFront,
  check: Check,
  checkCircle: CheckCircle2,
  chevronDown: ChevronDown,
  alert: CircleAlert,
  clock: Clock3,
  cloudSun: CloudSun,
  compass: Compass,
  external: ExternalLink,
  fuel: Fuel,
  globe: Globe2,
  heart: Heart,
  rupee: IndianRupee,
  info: Info,
  landmark: Landmark,
  dashboard: LayoutDashboard,
  lock: LockKeyhole,
  logout: LogOut,
  mail: Mail,
  map: Map,
  mapPin: MapPin,
  menu: Menu,
  message: MessageSquareText,
  mountain: Mountain,
  navigation: Navigation,
  pencil: Pencil,
  phone: Phone,
  plane: Plane,
  plus: Plus,
  route: Route,
  save: Save,
  search: Search,
  settings: Settings,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  ticket: Ticket,
  train: TrainFront,
  trash: Trash2,
  user: UserRound,
  users: Users,
  wallet: Wallet,
  x: X,
  utensils: Utensils
};

export const AppIcon = ({ name, ...props }) => {
  const Icon = iconMap[name] || Sparkles;
  return <Icon {...props} />;
};

export const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 className={`spin ${className}`} size={size} aria-hidden="true" />
);

export const PageLoader = ({ label = 'Loading your journey...' }) => (
  <div className="page-loader">
    <Spinner size={30} />
    <p>{label}</p>
  </div>
);

export const SkeletonGrid = ({ count = 6, className = 'destination-grid' }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, index) => (
      <div className="skeleton-card" key={index}>
        <div className="skeleton skeleton-image" />
        <div className="skeleton-body">
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line medium" />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon = 'compass', title, description, action }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <AppIcon name={icon} size={28} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
    {action}
  </div>
);

export const Avatar = ({ user, name, src, size = 44, className = '' }) => {
  const [error, setError] = useState(false);
  const displayName = name || user?.name || 'TravelMate';
  const image = src || user?.profileImage;
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.32) }}
    >
      {image && !error ? (
        <img src={image} alt={displayName} onError={() => setError(true)} />
      ) : (
        <span>{initials(displayName)}</span>
      )}
    </span>
  );
};

export const Badge = ({ children, icon, tone = 'neutral', className = '' }) => (
  <span className={`badge badge-${tone} ${className}`}>
    {icon && <AppIcon name={icon} size={13} />}
    {children}
  </span>
);

export const Rating = ({ value = 0, reviews }) => (
  <span className="rating" title={`${value} out of 5`}>
    <Star size={14} fill="currentColor" />
    <strong>{Number(value).toFixed(1)}</strong>
    {reviews !== undefined && <span>({reviews})</span>}
  </span>
);

export const StatusPill = ({ status }) => (
  <span className={`status-pill status-${status}`}>{status}</span>
);

export const StatCard = ({ icon = 'sparkles', label, value, hint, currency = false, tone = 'teal' }) => (
  <div className={`stat-card stat-${tone}`}>
    <div className="stat-icon">
      <AppIcon name={icon} size={20} />
    </div>
    <div>
      <p className="stat-label">{label}</p>
      <h3>{currency ? formatCurrency(value, { compact: true }) : value}</h3>
      <span>{hint}</span>
    </div>
  </div>
);

export const SectionHeading = ({ eyebrow, title, description, align = 'left', action }) => (
  <div className={`section-heading align-${align}`}>
    <div>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    {action}
  </div>
);

export const Toggle = ({ checked, onChange, label, description, name, disabled = false }) => (
  <label className={`toggle-row ${disabled ? 'is-disabled' : ''}`}>
    <span>
      <strong>{label}</strong>
      {description && <small>{description}</small>}
    </span>
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      disabled={disabled}
    />
    <span className="toggle-track" aria-hidden="true">
      <span className="toggle-thumb" />
    </span>
  </label>
);

export const Modal = ({ open, onClose, title, subtitle, children, width = 620 }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <div
        className="modal-card"
        style={{ maxWidth: width }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export const InlineNotice = ({ type = 'info', children }) => {
  const Icon = type === 'error' ? CircleAlert : type === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`inline-notice notice-${type}`}>
      <Icon size={18} />
      <div>{children}</div>
    </div>
  );
};
