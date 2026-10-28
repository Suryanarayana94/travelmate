import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, Pencil, Plus, Save, Star, Trash2, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HOTEL_TIERS, PRICE_UNITS, ROLE_MAP } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';
import { EmptyState, InlineNotice, Modal, PageLoader, Spinner } from '../../components/ui';

const emptyForm = (role, destinations = []) => ({
  title: '',
  description: '',
  destinationSlug: destinations[0]?.slug || 'goa',
  city: '',
  image: '',
  priceAmount: role === 'hotel' ? 3200 : role === 'transport' ? 16 : 1800,
  priceUnit: role === 'hotel' ? 'night' : role === 'transport' ? 'km' : 'day',
  capacity: 4,
  languages: '',
  tags: '',
  contactPhone: '',
  contactEmail: '',
  availability: true
});

const ServicesManager = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [services, setServices] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(user.role));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const role = ROLE_MAP[user.role];

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/services/mine'), api.get('/destinations?limit=50', { auth: false })])
      .then(([serviceResponse, destinationResponse]) => {
        setServices(serviceResponse.data);
        setDestinations(destinationResponse.data);
        setError('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const destinationOptions = useMemo(() => destinations, [destinations]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm(user.role, destinations),
      contactPhone: user.phone || '',
      contactEmail: user.email || '',
      languages: (user.languages || []).join(', ')
    });
    setFormError('');
    setOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description,
      destinationSlug: service.destinationSlug,
      city: service.city || '',
      image: service.image || '',
      priceAmount: service.price?.amount || 0,
      priceUnit: service.price?.unit || 'day',
      capacity: service.capacity || 1,
      languages: (service.languages || []).join(', '),
      tags: (service.tags || []).join(', '),
      contactPhone: service.contactPhone || '',
      contactEmail: service.contactEmail || '',
      availability: service.availability !== false
    });
    setFormError('');
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      type: user.role,
      title: form.title,
      description: form.description,
      destinationSlug: form.destinationSlug,
      city: form.city,
      image: form.image,
      price: { amount: Number(form.priceAmount), unit: form.priceUnit },
      capacity: Number(form.capacity),
      languages: form.languages,
      tags: form.tags,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail,
      availability: form.availability
    };
    try {
      if (editing) {
        await api.patch(`/services/${editing.id}`, payload);
        success('Service updated.');
      } else {
        await api.post('/services', payload);
        success('Service published to the marketplace.');
      }
      setOpen(false);
      load();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (service) => {
    if (!window.confirm(`Delete “${service.title}”? Existing bookings are kept.`)) return;
    try {
      await api.delete(`/services/${service.id}`);
      setServices((current) => current.filter((item) => item.id !== service.id));
      success('Service removed.');
    } catch (requestError) {
      toastError(requestError.message);
    }
  };

  const toggleAvailability = async (service) => {
    try {
      const response = await api.patch(`/services/${service.id}`, { availability: !service.availability });
      setServices((current) => current.map((item) => (item.id === service.id ? response.data : item)));
      success(response.data.availability ? 'Service is live again.' : 'Service paused.');
    } catch (requestError) {
      toastError(requestError.message);
    }
  };

  if (loading) return <PageLoader label="Loading your services..." />;

  return (
    <div className="dashboard-page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2><BriefcaseBusiness size={19} /> {role.label} services</h2>
            <p>Publish what you offer, set your rate and control availability.</p>
          </div>
          <button type="button" className="btn btn-primary btn-small" onClick={openCreate}><Plus size={15} /> Add service</button>
        </div>

        {error && <InlineNotice type="error">{error}</InlineNotice>}

        {services.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="You have not published a service yet"
            description="Add a title, destination and price. Travellers can then send you booking requests directly."
            action={<button type="button" className="btn btn-primary btn-small" onClick={openCreate}>Publish your first service</button>}
          />
        ) : (
          <div className="manage-list">
            {services.map((service) => (
              <article className={`manage-row ${service.availability ? '' : 'is-paused'}`} key={service.id}>
                <img src={service.image} alt="" />
                <div className="manage-copy">
                  <div className="manage-head">
                    <h3>{service.title}</h3>
                    <span className={`availability ${service.availability ? 'on' : 'off'}`}>{service.availability ? 'Live' : 'Paused'}</span>
                  </div>
                  <p>{service.description}</p>
                  <div className="manage-meta">
                    <span><Wallet size={13} /> {formatCurrency(service.price?.amount)} / {service.price?.unit}</span>
                    <span><Star size={13} fill="currentColor" /> {service.rating} ({service.reviews} reviews)</span>
                    <span>{service.destinationSlug} · up to {service.capacity}</span>
                  </div>
                  <div className="tag-row">
                    {(service.tags || []).map((tag) => <span key={tag} className="badge badge-soft">{tag}</span>)}
                  </div>
                </div>
                <div className="manage-actions">
                  <button type="button" className="btn btn-outline btn-small" onClick={() => openEdit(service)}><Pencil size={14} /> Edit</button>
                  <button type="button" className="btn btn-outline btn-small" onClick={() => toggleAvailability(service)}>
                    {service.availability ? 'Pause' : 'Go live'}
                  </button>
                  <button type="button" className="btn btn-danger-ghost btn-small" onClick={() => remove(service)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit service' : 'Publish a new service'}
        subtitle={`${role.label} · visible in the TravelMate marketplace`}
        width={720}
      >
        {formError && <InlineNotice type="error">{formError}</InlineNotice>}
        <form className="profile-form" onSubmit={submit}>
          <label className="field">
            <span>Service title</span>
            <input required maxLength="100" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder={user.role === 'hotel' ? 'Boutique room near Anjuna Beach' : user.role === 'transport' ? 'Airport transfer & coastal cab' : 'Goa heritage & hidden-beach guide'} />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea required rows="4" maxLength="1000" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="What is included, what makes it special, pickup details..." />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Destination</span>
              <select required value={form.destinationSlug} onChange={(e) => setForm((c) => ({ ...c, destinationSlug: e.target.value }))}>
                {destinationOptions.map((destination) => (
                  <option key={destination.slug} value={destination.slug}>{destination.name}, {destination.state}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Neighbourhood / base city</span>
              <input value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} placeholder="Anjuna" />
            </label>
          </div>
          <div className="field-grid field-grid-three">
            <label className="field">
              <span>Price (₹)</span>
              <input type="number" min="1" required value={form.priceAmount} onChange={(e) => setForm((c) => ({ ...c, priceAmount: e.target.value }))} />
            </label>
            <label className="field">
              <span>Price unit</span>
              <select value={form.priceUnit} onChange={(e) => setForm((c) => ({ ...c, priceUnit: e.target.value }))}>
                {PRICE_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Capacity (guests)</span>
              <input type="number" min="1" max="100" value={form.capacity} onChange={(e) => setForm((c) => ({ ...c, capacity: e.target.value }))} />
            </label>
          </div>
          {user.role === 'hotel' && (
            <p className="field-hint">Tip: choose “per night” for rooms and mention your {HOTEL_TIERS.find((t) => t.value === user.hotelCategory)?.label || 'standard'} category in the title.</p>
          )}
          <label className="field">
            <span>Cover image URL (optional)</span>
            <input value={form.image} onChange={(e) => setForm((c) => ({ ...c, image: e.target.value }))} placeholder="https://... or leave blank to use the destination photo" />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Languages (comma separated)</span>
              <input value={form.languages} onChange={(e) => setForm((c) => ({ ...c, languages: e.target.value }))} />
            </label>
            <label className="field">
              <span>Tags (comma separated)</span>
              <input value={form.tags} onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))} placeholder="Heritage, Food, Sunset" />
            </label>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Contact phone</span>
              <input value={form.contactPhone} onChange={(e) => setForm((c) => ({ ...c, contactPhone: e.target.value }))} />
            </label>
            <label className="field">
              <span>Contact email</span>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm((c) => ({ ...c, contactEmail: e.target.value }))} />
            </label>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.availability} onChange={(e) => setForm((c) => ({ ...c, availability: e.target.checked }))} />
            <span>Show this service as available in the marketplace</span>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Spinner size={16} /> Saving...</> : <><Save size={16} /> {editing ? 'Save changes' : 'Publish service'}</>}
            </button>
            <span className="verified-hint"><BadgeCheck size={15} /> Visible to every traveller</span>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicesManager;
