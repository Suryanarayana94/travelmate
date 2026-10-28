import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import BookingModal from '../components/BookingModal';
import { EmptyState, InlineNotice, SectionHeading, SkeletonGrid } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { SERVICE_TYPES } from '../lib/constants';
import { debounce } from '../lib/format';

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { info } = useToast();
  const [filters, setFilters] = useState({
    q: '',
    type: searchParams.get('type') || '',
    destinationSlug: searchParams.get('destination') || '',
    sort: 'featured'
  });
  const [services, setServices] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/destinations?limit=50', { auth: false })
      .then((response) => setDestinations(response.data))
      .catch(() => {});
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.type) params.set('type', filters.type);
    if (filters.destinationSlug) params.set('destinationSlug', filters.destinationSlug);
    if (filters.sort) params.set('sort', filters.sort);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get(`/services?${query}`, { signal: controller.signal })
      .then((response) => setServices(response.data))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.destinationSlug) params.set('destination', filters.destinationSlug);
    setSearchParams(params, { replace: true });
  }, [filters.type, filters.destinationSlug, setSearchParams]);

  const debouncedSearch = useMemo(
    () => debounce((value) => setFilters((current) => ({ ...current, q: value })), 320),
    []
  );

  const handleBook = (service) => {
    if (user && user.role !== 'traveller') {
      info('Switch to a traveller account to request bookings.');
      return;
    }
    setSelected(service);
  };

  return (
    <div className="page-shell">
      <section className="page-banner">
        <div className="container">
          <span className="eyebrow"><SlidersHorizontal size={15} /> Local travel services</span>
          <h1>Guides, transport and stays — only if you need them</h1>
          <p>Verified local providers across all TravelMate destinations, with clear per-day, per-night or per-km pricing.</p>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">Service</span>
              <div className="chip-row">
                <button type="button" className={`chip ${!filters.type ? 'active' : ''}`} onClick={() => setFilters((c) => ({ ...c, type: '' }))}>All</button>
                {SERVICE_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type.value}
                    className={`chip ${filters.type === type.value ? 'active' : ''}`}
                    onClick={() => setFilters((c) => ({ ...c, type: type.value }))}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="service-destination">Destination</label>
              <select
                id="service-destination"
                value={filters.destinationSlug}
                onChange={(event) => setFilters((c) => ({ ...c, destinationSlug: event.target.value }))}
              >
                <option value="">All destinations</option>
                {destinations.map((destination) => (
                  <option key={destination.slug} value={destination.slug}>{destination.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group filter-sort">
              <label htmlFor="service-sort">Sort</label>
              <select id="service-sort" value={filters.sort} onChange={(event) => setFilters((c) => ({ ...c, sort: event.target.value }))}>
                <option value="featured">Featured first</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="filter-search">
              <Search size={17} />
              <input
                placeholder="Search guides, cabs, stays..."
                defaultValue={filters.q}
                onChange={(event) => debouncedSearch(event.target.value)}
                aria-label="Search services"
              />
              {filters.q && <button type="button" onClick={() => setFilters((c) => ({ ...c, q: '' }))} aria-label="Clear search"><X size={15} /></button>}
            </div>
          </div>

          <div className="results-row">
            <p><strong>{services.length}</strong> service{services.length === 1 ? '' : 's'} available</p>
            {user?.role === 'traveller' && <span className="muted-note">Requests go straight to the provider’s dashboard.</span>}
          </div>

          {error && <InlineNotice type="error">{error}</InlineNotice>}
          {loading ? (
            <SkeletonGrid count={6} className="service-grid" />
          ) : services.length === 0 ? (
            <EmptyState
              icon="briefcase"
              title="No services match this filter"
              description="Try another destination or service type. Provider accounts can publish new services from their dashboard."
              action={<button type="button" className="btn btn-primary" onClick={() => setFilters({ q: '', type: '', destinationSlug: '', sort: 'featured' })}>Reset filters</button>}
            />
          ) : (
            <div className="service-grid">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} onBook={handleBook} />
              ))}
            </div>
          )}

          <div className="provider-cta">
            <SectionHeading
              eyebrow="For providers"
              title="List your guide, vehicle or property"
              description="Create a provider account, publish a service in minutes and manage booking requests from one dashboard."
            />
            <div className="provider-cta-actions">
              <a href="/register?role=guide" className="btn btn-primary">Join as a guide</a>
              <a href="/register?role=transport" className="btn btn-outline">List transport</a>
              <a href="/register?role=hotel" className="btn btn-outline">List a stay</a>
            </div>
          </div>
        </div>
      </section>

      <BookingModal service={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Services;
