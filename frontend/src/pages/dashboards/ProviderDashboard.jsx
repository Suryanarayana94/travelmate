import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  BriefcaseBusiness,
  CalendarCheck,
  CarFront,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Route,
  Sparkles,
  Star,
  Wallet,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, pluralise } from '../../lib/format';
import { Avatar, EmptyState, InlineNotice, PageLoader, StatCard, StatusPill } from '../../components/ui';

const typeIcons = { guide: Route, transport: CarFront, hotel: BedDouble };
const roleCopy = {
  guide: {
    title: 'Your guided experiences',
    cta: 'Publish a new guided experience',
    hint: 'Guests book guides per day. Add languages, specialities and a clear meeting style.',
    stat: 'Guide earnings'
  },
  transport: {
    title: 'Your vehicles & routes',
    cta: 'Add a vehicle or route',
    hint: 'Route-based or per-km pricing helps travellers compare fairly.',
    stat: 'Transport earnings'
  },
  hotel: {
    title: 'Your rooms & stays',
    cta: 'List a room or stay',
    hint: 'Nightly rates, amenities and neighbourhood notes convert best.',
    stat: 'Stay earnings'
  }
};

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [summary, setSummary] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const copy = roleCopy[user.role] || roleCopy.guide;

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/dashboard'), api.get('/services/mine'), api.get('/bookings/provider')])
      .then(([summaryResponse, serviceResponse, bookingResponse]) => {
        setSummary(summaryResponse.data);
        setServices(serviceResponse.data);
        setBookings(bookingResponse.data);
        setError('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const setStatus = async (booking, status) => {
    setBusyId(booking.id);
    try {
      const response = await api.patch(`/bookings/${booking.id}/status`, { status });
      setBookings((current) => current.map((item) => (item.id === booking.id ? response.data : item)));
      success(`Booking ${status}.`);
    } catch (requestError) {
      toastError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Loading your provider workspace..." />;

  const pending = bookings.filter((booking) => booking.status === 'pending');

  return (
    <div className="dashboard-page">
      {error && <InlineNotice type="error">{error}</InlineNotice>}

      <div className="profile-strip">
        <Avatar user={user} size={64} />
        <div>
          <div className="profile-strip-name">
            <h2>{user.name}</h2>
            {user.verified && <span className="verified-badge"><BadgeCheck size={15} /> Verified provider</span>}
          </div>
          <p>
            {user.city || 'Add your city'} · {user.role === 'guide' ? `${user.experienceYears || 0} yrs guiding` : user.role === 'transport' ? `${user.vehicleTypes?.length || 0} vehicle types` : `${user.hotelCategory || 'standard'} category`}
          </p>
          <div className="profile-strip-contact">
            {user.phone && <span><Phone size={14} /> {user.phone}</span>}
            {user.email && <span><Mail size={14} /> {user.email}</span>}
          </div>
        </div>
        <Link to="/dashboard/profile" className="btn btn-outline btn-small"><Pencil size={15} /> Update profile</Link>
      </div>

      <div className="stat-grid">
        {(summary?.cards || []).map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="dashboard-split">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2><BriefcaseBusiness size={19} /> {copy.title}</h2>
              <p>{copy.hint}</p>
            </div>
            <Link to="/dashboard/services" className="btn btn-primary btn-small"><Plus size={15} /> Manage</Link>
          </div>

          {services.length === 0 ? (
            <EmptyState
              icon="briefcase"
              title="No services published yet"
              description="Publish your first service so travellers can discover and book you."
              action={<Link to="/dashboard/services" className="btn btn-primary btn-small">{copy.cta}</Link>}
            />
          ) : (
            <div className="provider-service-list">
              {services.map((service) => {
                const Icon = typeIcons[service.type] || BriefcaseBusiness;
                return (
                  <article key={service.id} className="provider-service">
                    <img src={service.image} alt="" />
                    <div className="provider-service-copy">
                      <div className="provider-service-head">
                        <h3>{service.title}</h3>
                        <span className={`availability ${service.availability ? 'on' : 'off'}`}>
                          {service.availability ? 'Available' : 'Paused'}
                        </span>
                      </div>
                      <p><Icon size={14} /> {service.destinationSlug} · {service.city}</p>
                      <div className="provider-service-meta">
                        <span><Star size={13} fill="currentColor" /> {service.rating} ({service.reviews})</span>
                        <span><Wallet size={13} /> {formatCurrency(service.price?.amount)} / {service.price?.unit}</span>
                        <span>Up to {service.capacity} guests</span>
                      </div>
                    </div>
                    <Link to="/dashboard/services" className="icon-button" aria-label="Edit service"><Pencil size={16} /></Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="dashboard-aside">
          <section className="panel">
            <div className="panel-head">
              <div><h2><Clock3 size={19} /> Pending requests</h2><p>{pending.length ? 'Respond quickly to win the booking.' : 'You are all caught up.'}</p></div>
              <Link to="/dashboard/bookings" className="text-button">All requests</Link>
            </div>
            {pending.length === 0 ? (
              <div className="mini-empty">
                <p>No pending requests right now.</p>
                <Link to="/services" className="btn btn-outline btn-small">See the marketplace</Link>
              </div>
            ) : (
              <div className="request-list">
                {pending.slice(0, 4).map((booking) => (
                  <div className="request-card" key={booking.id}>
                    <div className="request-top">
                      <Avatar name={booking.traveller?.name} user={booking.traveller} size={34} />
                      <div>
                        <strong>{booking.traveller?.name || 'Traveller'}</strong>
                        <small>{booking.serviceTitle}</small>
                      </div>
                      <StatusPill status={booking.status} />
                    </div>
                    <div className="request-meta">
                      <span><CalendarCheck size={13} /> {formatDate(booking.bookingDate)}</span>
                      <span>{pluralise(booking.guests, 'guest')}</span>
                      <span>{formatCurrency(booking.amount)}</span>
                    </div>
                    {booking.note && <p className="request-note">“{booking.note}”</p>}
                    <div className="request-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        disabled={busyId === booking.id}
                        onClick={() => setStatus(booking, 'confirmed')}
                      >
                        <Check size={14} /> Confirm
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-small"
                        disabled={busyId === booking.id}
                        onClick={() => setStatus(booking, 'cancelled')}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel panel-accent">
            <h2><Sparkles size={19} /> Profile strength</h2>
            <p>
              Profiles with a photo, phone number, city and bio get noticed far more often.
              You are at {user.profileCompletion || 0}%.
            </p>
            <div className="big-progress"><span style={{ width: `${user.profileCompletion || 0}%` }} /></div>
            <Link to="/dashboard/profile" className="btn btn-dark btn-small">Complete profile <ArrowRight size={14} /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProviderDashboard;
