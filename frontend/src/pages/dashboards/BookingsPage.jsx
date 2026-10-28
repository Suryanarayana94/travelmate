import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, CheckCircle2, Clock3, Mail, Phone, UserRound, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BOOKING_STATUSES } from '../../lib/constants';
import { formatCurrency, formatDate, pluralise } from '../../lib/format';
import { Avatar, EmptyState, InlineNotice, PageLoader, StatusPill } from '../../components/ui';

const BookingsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const isTraveller = user.role === 'traveller';

  const load = useCallback(() => {
    setLoading(true);
    api.get(isTraveller ? '/bookings/mine' : '/bookings/provider')
      .then((response) => {
        setBookings(response.data);
        setError('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [isTraveller]);

  useEffect(load, [load]);

  const filtered = useMemo(
    () => (filter ? bookings.filter((booking) => booking.status === filter) : bookings),
    [bookings, filter]
  );

  const counts = useMemo(
    () =>
      bookings.reduce(
        (acc, booking) => ({ ...acc, [booking.status]: (acc[booking.status] || 0) + 1 }),
        {}
      ),
    [bookings]
  );

  const updateStatus = async (booking, status) => {
    setBusyId(booking.id);
    try {
      const response = await api.patch(`/bookings/${booking.id}/status`, { status });
      setBookings((current) => current.map((item) => (item.id === booking.id ? response.data : item)));
      success(`Booking marked ${status}.`);
    } catch (requestError) {
      toastError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Loading bookings..." />;

  return (
    <div className="dashboard-page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2><CalendarCheck size={19} /> {isTraveller ? 'My booking requests' : 'Booking requests'}</h2>
            <p>
              {isTraveller
                ? 'Track every request you have sent to guides, transport agencies and hotels.'
                : 'Confirm or decline requests. Travellers see updates immediately.'}
            </p>
          </div>
        </div>

        {error && <InlineNotice type="error">{error}</InlineNotice>}

        <div className="chip-row booking-filters">
          <button type="button" className={`chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>
            All ({bookings.length})
          </button>
          {BOOKING_STATUSES.map((status) => (
            <button type="button" key={status} className={`chip ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
              {status[0].toUpperCase() + status.slice(1)} ({counts[status] || 0})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={bookings.length ? 'No bookings with this status' : 'No bookings yet'}
            description={
              isTraveller
                ? 'Find a guide, cab or stay for your next destination and send a booking request.'
                : 'When travellers request your services they will appear here instantly.'
            }
          />
        ) : (
          <div className="booking-list">
            {filtered.map((booking) => (
              <article className="booking-row" key={booking.id}>
                <div className="booking-thumb">
                  {booking.service?.image ? <img src={booking.service.image} alt="" /> : <CalendarCheck size={22} />}
                </div>
                <div className="booking-row-copy">
                  <div className="booking-row-head">
                    <h3>{booking.serviceTitle || booking.service?.title}</h3>
                    <StatusPill status={booking.status} />
                  </div>
                  <div className="booking-row-meta">
                    <span><CalendarCheck size={13} /> {formatDate(booking.bookingDate)}</span>
                    <span><Clock3 size={13} /> {pluralise(booking.duration || 1, booking.service?.price?.unit === 'night' ? 'night' : 'day')}</span>
                    <span><UserRound size={13} /> {pluralise(booking.guests, 'guest')}</span>
                    <span><strong>{formatCurrency(booking.amount)}</strong></span>
                  </div>

                  <div className="booking-counterparty">
                    {isTraveller ? (
                      booking.provider && (
                        <>
                          <Avatar user={booking.provider} size={30} />
                          <span>{booking.provider.name} <small>· {booking.serviceType}</small></span>
                          {booking.provider.phone && <a href={`tel:${booking.provider.phone}`}><Phone size={13} /> {booking.provider.phone}</a>}
                          {booking.provider.email && <a href={`mailto:${booking.provider.email}`}><Mail size={13} /> {booking.provider.email}</a>}
                        </>
                      )
                    ) : (
                      booking.traveller && (
                        <>
                          <Avatar user={booking.traveller} size={30} />
                          <span>{booking.traveller.name}</span>
                          {booking.traveller.phone && <a href={`tel:${booking.traveller.phone}`}><Phone size={13} /> {booking.traveller.phone}</a>}
                          {booking.traveller.email && <a href={`mailto:${booking.traveller.email}`}><Mail size={13} /> {booking.traveller.email}</a>}
                        </>
                      )
                    )}
                  </div>
                  {booking.note && <p className="booking-note">“{booking.note}”</p>}
                </div>

                <div className="booking-row-actions">
                  {isTraveller ? (
                    booking.status === 'pending' || booking.status === 'confirmed' ? (
                      <button type="button" className="btn btn-danger-ghost btn-small" disabled={busyId === booking.id} onClick={() => updateStatus(booking, 'cancelled')}>
                        <X size={14} /> Cancel request
                      </button>
                    ) : booking.status === 'completed' ? (
                      <span className="booking-done"><CheckCircle2 size={15} /> Completed</span>
                    ) : null
                  ) : (
                    <>
                      {booking.status === 'pending' && (
                        <>
                          <button type="button" className="btn btn-primary btn-small" disabled={busyId === booking.id} onClick={() => updateStatus(booking, 'confirmed')}><Check size={14} /> Confirm</button>
                          <button type="button" className="btn btn-danger-ghost btn-small" disabled={busyId === booking.id} onClick={() => updateStatus(booking, 'cancelled')}><X size={14} /> Decline</button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button type="button" className="btn btn-outline btn-small" disabled={busyId === booking.id} onClick={() => updateStatus(booking, 'completed')}><CheckCircle2 size={14} /> Mark completed</button>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BookingsPage;
