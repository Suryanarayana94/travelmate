import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import DestinationCard from '../components/DestinationCard';
import { EmptyState, InlineNotice, SkeletonGrid } from '../components/ui';
import { api } from '../lib/api';
import { debounce } from '../lib/format';

const SORTS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' }
];

const Destinations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    region: searchParams.get('region') || '',
    tag: searchParams.get('tag') || '',
    sort: searchParams.get('sort') || 'popular'
  });
  const [data, setData] = useState({ items: [], meta: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.region) params.set('region', filters.region);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.sort) params.set('sort', filters.sort);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get(`/destinations?${query}`, { signal: controller.signal, auth: false })
      .then((response) => setData({ items: response.data, meta: response.meta || {} }))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.region) params.set('region', filters.region);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.sort) params.set('sort', filters.sort);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const debouncedSearch = useMemo(() => debounce((value) => updateFilter('q', value), 320), []);

  const clearAll = () => setFilters({ q: '', region: '', tag: '', sort: 'popular' });
  const hasFilters = Boolean(filters.q || filters.region || filters.tag);

  const regions = data.meta.regions || [];
  const tags = ['Beaches', 'Heritage', 'Mountains', 'Backwaters', 'Wildlife', 'Food', 'UNESCO'];

  return (
    <div className="page-shell">
      <section className="page-banner">
        <div className="container">
          <span className="eyebrow"><MapPin size={15} /> Explore India</span>
          <h1>Find your next destination</h1>
          <p>Six carefully curated regions with famous places, season notes and realistic daily costs.</p>
          <div className="banner-search">
            <Search size={18} />
            <input
              value={filters.q}
              onChange={(event) => {
                const { value } = event.target;
                setFilters((current) => ({ ...current, q: value }));
                debouncedSearch(value);
              }}
              placeholder="Search Goa, forts, backwaters, Rajasthan..."
              aria-label="Search destinations"
            />
            {filters.q && (
              <button type="button" onClick={() => updateFilter('q', '')} aria-label="Clear search"><X size={16} /></button>
            )}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label"><SlidersHorizontal size={15} /> Region</span>
              <div className="chip-row">
                <button type="button" className={`chip ${!filters.region ? 'active' : ''}`} onClick={() => updateFilter('region', '')}>All regions</button>
                {regions.map((region) => (
                  <button
                    type="button"
                    key={region}
                    className={`chip ${filters.region === region ? 'active' : ''}`}
                    onClick={() => updateFilter('region', region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label"><Filter size={15} /> Interest</span>
              <div className="chip-row">
                <button type="button" className={`chip ${!filters.tag ? 'active' : ''}`} onClick={() => updateFilter('tag', '')}>Anything</button>
                {tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className={`chip ${filters.tag === tag ? 'active' : ''}`}
                    onClick={() => updateFilter('tag', tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group filter-sort">
              <label htmlFor="sort-select">Sort</label>
              <select id="sort-select" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
              </select>
            </div>
          </div>

          <div className="results-row">
            <p><strong>{data.meta.total ?? data.items.length}</strong> destination{(data.meta.total ?? data.items.length) === 1 ? '' : 's'} found</p>
            {hasFilters && <button type="button" className="text-button" onClick={clearAll}>Clear filters</button>}
          </div>

          {error && <InlineNotice type="error">{error}</InlineNotice>}
          {loading ? (
            <SkeletonGrid count={6} />
          ) : data.items.length === 0 ? (
            <EmptyState
              icon="search"
              title="No destinations match that search"
              description="Try a broader interest, a different region, or clear your filters to see all six destinations."
              action={<button type="button" className="btn btn-primary" onClick={clearAll}>Clear filters</button>}
            />
          ) : (
            <div className="destination-grid">
              {data.items.map((destination, index) => (
                <DestinationCard key={destination.slug} destination={destination} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Destinations;
