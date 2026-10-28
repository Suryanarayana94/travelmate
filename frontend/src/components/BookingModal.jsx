import { useEffect, useState } from 'react';
import { CalendarDays, Info, MapPin, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, toDateInput } from '../lib/format';
import { Avatar, InlineNotice, Modal, Spinner } from './ui';

const BookingModal = ({ service, onClose }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({
    bookingDate: toDateInput(new Date(Date.now() + 7 * 86400000)),
    duration: 1,
    guests: 1,
    distanceKm: 120,
    note: '',
    contactPhone: '',
    tripId: ''
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!service || !user || user.role !== 'traveller') return;
    setForm((current) => ({
      ...current,
      duration: service.type === 'hotel' ? 2 : 1,
      guests: Math.min(2, service.capacity || 2),
      contactPhone: user.phone || ''
    }));
    api.get('/trips?limit=20').then((response) => setTrips(response.data)).catch(() => {});
  }, [service, user]);

  if (!service) return null;

  const unit = service.price?.unit || 'day';
  const amount =
    unit === 'km'
      ? service.price.amount * Math.max(1, Number(form.distanceKm) || 1)
      : unit === 'trip'
        ? service.price.amount
        : service.price.amount * Math.max(1, Number(form.duration) || 1);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await api.post('/bookings', {
        serviceId: service.id,
        bookingDate: form.bookingDate,
        duration: form.duration,
        guests: form.guests,
        distanceKm: form.distanceKm,
        note: form.note,
        contactPhone: form.contactPhone,
        tripId: form.tripId || undefined
      });
      success('Booking request sent. The provider will confirm from their dashboard.');
      onClose();
    } catch (requestError) {
      setSubmitError(requestError.message);
      toastError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Modal open onClose={onClose} title="Sign in to request a booking">
        <InlineNotice type="info">
          Create a free traveller account or sign in to send this request to {service.owner?.name || 'the provider'}.
        </InlineNotice>
        <div className="modal-actions">
          <a href="/login" className="btn btn-primary">Sign in</a>
          <a href="/register?role=traveller" className="btn btn-outline">Create account</a>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Request this service"
      subtitle={`${service.title} · ${service.city || service.destinationSlug}`}
      width={660}
    >
      <div className="booking-summary">
        <img src={service.image} alt="" />
        <div>
          {service.owner && (
            <div className="booking-owner">
              <Avatar user={service.owner} size={34} />
              <span>{service.owner.name}{service.owner.verified ? ' · Verified' : ''}</span>
            </div>
          )}
          <p><MapPin size={14} /> {service.city || service.destinationSlug} · capacity {service.capacity}</p>
          <strong>{formatCurrency(service.price.amount)} <small>/ {unit}</small></strong>
        </div>
      </div>

      {submitError && <InlineNotice type="error">{submitError}</InlineNotice>}

      <form className="booking-form" onSubmit={submit}>
        <div className="field-grid">
          <label className="field">
            <span><CalendarDays size={15} /> Booking date</span>
            <input
              type="date"
              required
              min={toDateInput()}
              value={form.bookingDate}
              onChange={(event) => setForm((c) => ({ ...c, bookingDate: event.target.value }))}
            />
          </label>
          <label className="field">
            <span><Users size={15} /> Guests</span>
            <input
              type="number"
              min="1"
              max={service.capacity || 30}
              value={form.guests}
              onChange={(event) => setForm((c) => ({ ...c, guests: event.target.value }))}
            />
          </label>
        </div>

        {unit === 'km' ? (
          <label className="field">
            <span><MapPin size={15} /> Approximate distance (km)</span>
            <input
              type="number"
              min="10"
              step="10"
              value={form.distanceKm}
              onChange={(event) => setForm((c) => ({ ...c, distanceKm: event.target.value }))}
            />
          </label>
        ) : unit !== 'trip' ? (
          <label className="field">
            <span><CalendarDays size={15} /> Number of {unit}s</span>
            <input
              type="number"
              min="1"
              max="30"
              value={form.duration}
              onChange={(event) => setForm((c) => ({ ...c, duration: event.target.value }))}
            />
          </label>
        ) : null}

        <label className="field">
          <span><Info size={15} /> Link to a saved trip (optional)</span>
          <select value={form.tripId} onChange={(event) => setForm((c) => ({ ...c, tripId: event.target.value }))}>
            <option value="">No linked trip</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.destinationName} · {trip.days} days · {formatCurrency(trip.estimate?.total)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Contact phone</span>
          <input
            value={form.contactPhone}
            onChange={(event) => setForm((c) => ({ ...c, contactPhone: event.target.value }))}
            placeholder="+91 ..."
          />
        </label>

        <label className="field">
          <span>Note to the provider</span>
          <textarea
            rows="3"
            maxLength="500"
            value={form.note}
            onChange={(event) => setForm((c) => ({ ...c, note: event.target.value }))}
            placeholder="Timings, pickup point, special requests..."
          />
        </label>

        <div className="booking-total">
          <div>
            <small>Estimated booking amount</small>
            <strong>{formatCurrency(amount)}</strong>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><Spinner size={16} /> Sending...</> : 'Send request'}
          </button>
        </div>
        <p className="form-fineprint">The provider confirms availability before any payment. TravelMate does not process payments in this prototype.</p>
      </form>
    </Modal>
  );
};

export default BookingModal;
