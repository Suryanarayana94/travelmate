import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Compass,
  IndianRupee,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, pluralise } from '../../lib/format';
import { Avatar, EmptyState, InlineNotice, PageLoader, StatCard, StatusPill } from '../../components/ui';

const TravellerDashboard = () => {
  const { success, error: toastError } = useToast();
  const [summary, setSummary] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/dashboard'), api.get('/trips?limit=20')])
      .then(([summaryResponse, tripResponse]) => {
        setSummary(summaryResponse.data);
        setTrips(tripResponse.data);
        setError('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (trip, status) => {
    try {
      const response = await api.patch(`/trips/${trip.id}`, { status });
      setTrips((current) => current.map((item) => (item.id === trip.id ? response.data : item)));
      success(`Trip marked as ${status}.`);
    } catch (requestError) {
      toastError(requestError.message);
    }
  };

  const removeTrip = async (trip) => {
    if (!window.confirm(`Remove your ${trip.destinationName} plan?`)) return;
    try {
      await api.delete(`/trips/${trip.id}`);
      setTrips((current) => current.filter((item) => item.id !== trip.id));
      success('Trip plan removed.');
    } catch (requestError) {
      toastError(requestError.message);
    }
  };

  if (loading) return <PageLoader label="Loading your traveller workspace..." />;

  return (
    <div className="dashboard-page">
      {error && <InlineNotice type="error">{error}</InlineNotice>}

      <div className="stat-grid">
        {(summary?.cards || []).map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="dashboard-split">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2><Compass size={19} /> Saved trip plans</h2>
              <p>Estimates are stored with their full breakdown in MongoDB.</p>
            </div>
            <Link to="/plan" className="btn btn-primary btn-small"><Plus size={15} /> New plan</Link>
          </div>

          {trips.length === 0 ? (
            <EmptyState
              icon="map"
              title="No trip plans yet"
              description="Run the estimator and save your first plan. It will appear here with its itemised cost."
              action={<Link to="/plan" className="btn btn-primary btn-small">Plan a trip</Link>}
            />
          ) : (
            <div className="trip-list">
              {trips.map((trip) => (
                <article className={`trip-card ${expanded === trip.id ? 'is-open' : ''}`} key={trip.id}>
                  <div className="trip-card-head">
                    <div className="trip-route">
                      <span className="trip-icon"><MapPin size={18} /></span>
                      <div>
                        <h3>{trip.boardingPoint?.name} → {trip.destinationName}</h3>
                        <p>
                          {formatDate(trip.startDate)} · {pluralise(trip.days, 'day')} · {pluralise(trip.travelers, 'traveller')}
                        </p>
                      </div>
                    </div>
                    <div className="trip-head-right">
                      <StatusPill status={trip.status} />
                      <div className="trip-total">
                        <strong>{formatCurrency(trip.estimate?.total)}</strong>
                        <small>{formatCurrency(trip.estimate?.perPerson)} / person</small>
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setExpanded(expanded === trip.id ? null : trip.id)}
                      >
                        {expanded === trip.id ? 'Hide details' : 'View breakdown'}
                      </button>
                    </div>
                  </div>

                  <div className="trip-tags">
                    <span><CalendarDays size={13} /> {pluralise(trip.options?.days, 'day')}</span>
                    <span><Users size={13} /> {trip.options?.travelers} travellers</span>
                    <span><IndianRupee size={13} /> {trip.estimate?.roadDistanceKm?.toLocaleString('en-IN')} km</span>
                    {trip.options?.needGuide && <span><CheckCircle2 size={13} /> Guide included</span>}
                    {trip.options?.needHotel && <span><CheckCircle2 size={13} /> {trip.options.hotelTier} stay</span>}
                    {!trip.options?.needTransport && <span>Transport not included</span>}
                  </div>

                  {expanded === trip.id && (
                    <div className="trip-breakdown">
                      {(trip.estimate?.lineItems || []).map((item) => (
                        <div key={item.key}>
                          <span>{item.label}<small>{item.details}</small></span>
                          <strong>{formatCurrency(item.amount)}</strong>
                        </div>
                      ))}
                      <div className="trip-breakdown-total">
                        <span>Total incl. taxes & buffer</span>
                        <strong>{formatCurrency(trip.estimate?.total)}</strong>
                      </div>
                      {trip.notes && <p className="trip-note">{trip.notes}</p>}
                      <div className="trip-actions">
                        {trip.status === 'planned' && (
                          <button type="button" className="btn btn-primary btn-small" onClick={() => updateStatus(trip, 'booked')}>
                            Mark as booked
                          </button>
                        )}
                        {trip.status === 'booked' && (
                          <button type="button" className="btn btn-outline btn-small" onClick={() => updateStatus(trip, 'completed')}>
                            Mark as completed
                          </button>
                        )}
                        <Link to={`/services?destination=${trip.destinationSlug}`} className="btn btn-outline btn-small">
                          Find providers <ArrowRight size={14} />
                        </Link>
                        <button type="button" className="btn btn-danger-ghost btn-small" onClick={() => removeTrip(trip)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="dashboard-aside">
          <section className="panel">
            <div className="panel-head">
              <div><h2><CalendarCheck size={19} /> Recent bookings</h2><p>Latest provider requests.</p></div>
              <Link to="/dashboard/bookings" className="text-button">View all</Link>
            </div>
            {(summary?.recentBookings || []).length === 0 ? (
              <div className="mini-empty">
                <p>No bookings yet. Explore verified guides, cabs and stays.</p>
                <Link to="/services" className="btn btn-outline btn-small">Browse services</Link>
              </div>
            ) : (
              <div className="mini-booking-list">
                {summary.recentBookings.map((booking) => (
                  <div className="mini-booking" key={booking.id}>
                    {booking.service?.image && <img src={booking.service.image} alt="" />}
                    <div>
                      <strong>{booking.serviceTitle}</strong>
                      <small>{booking.serviceType} · {formatDate(booking.bookingDate)}</small>
                      <span>{formatCurrency(booking.amount)}</span>
                    </div>
                    <StatusPill status={booking.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel panel-accent">
            <h2><Sparkles size={19} /> Traveller tip</h2>
            <p>Turn transport and hotel off in the planner to see the true cost of a guide-only or stay-only trip.</p>
            <Link to="/plan" className="btn btn-dark btn-small">Try the planner</Link>
          </section>

          <section className="panel">
            <div className="panel-head compact">
              <div><h2>Destination shortcut</h2><p>Famous places with photos.</p></div>
            </div>
            <div className="mini-destination-list">
              {['goa', 'jaipur', 'kerala', 'manali'].map((slug) => (
                <Link key={slug} to={`/destinations/${slug}`} className="mini-destination">
                  <img src={`/images/places/${slug === 'kerala' ? 'alleppey-backwaters' : slug === 'manali' ? 'solang-valley' : slug === 'jaipur' ? 'amber-fort' : 'baga-beach'}.jpg`} alt="" />
                  <span>{slug[0].toUpperCase() + slug.slice(1)}</span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default TravellerDashboard;
