import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  IndianRupee,
  Languages,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users
} from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import { Badge, EmptyState, InlineNotice, PageLoader, SectionHeading } from '../components/ui';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';

const DestinationDetail = () => {
  const { slug } = useParams();
  const [destination, setDestination] = useState(null);
  const [services, setServices] = useState([]);
  const [activePlace, setActivePlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/destinations/${slug}`, { auth: false }),
      api.get(`/services?destinationSlug=${slug}&limit=6`, { auth: false })
    ])
      .then(([destinationResponse, serviceResponse]) => {
        if (!active) return;
        setDestination(destinationResponse.data);
        setServices(serviceResponse.data);
        setActivePlace(destinationResponse.data.places?.[0] || null);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <PageLoader label="Opening destination guide..." />;

  if (error || !destination) {
    return (
      <div className="container section">
        <InlineNotice type="error">{error || 'Destination not found'}</InlineNotice>
        <Link to="/destinations" className="btn btn-outline"><ArrowLeft size={16} /> Back to destinations</Link>
      </div>
    );
  }

  const dailyCosts = [
    { label: 'Budget stay', value: destination.dailyCosts.budgetHotel, icon: 'bed' },
    { label: 'Standard stay', value: destination.dailyCosts.standardHotel, icon: 'bed' },
    { label: 'Premium stay', value: destination.dailyCosts.premiumHotel, icon: 'bed' },
    { label: 'Food per person', value: destination.dailyCosts.food, icon: 'utensils' },
    { label: 'Local transport', value: destination.dailyCosts.localTransport, icon: 'car' },
    { label: 'Guide per day', value: destination.dailyCosts.guide, icon: 'route' }
  ];

  return (
    <div className="page-shell">
      <section className="destination-hero">
        <img src={destination.heroImage} alt={destination.heroAlt || destination.name} className="destination-hero-image" />
        <div className="destination-hero-shade" />
        <div className="container destination-hero-content">
          <Link to="/destinations" className="back-link"><ArrowLeft size={16} /> All destinations</Link>
          <div className="destination-hero-copy">
            <div className="hero-badges">
              <Badge tone="glass"><MapPin size={13} /> {destination.state}</Badge>
              <Badge tone="glass"><Star size={13} fill="currentColor" /> {destination.rating} rated</Badge>
              <Badge tone="glass">{destination.region}</Badge>
            </div>
            <h1>{destination.name}</h1>
            <p>{destination.tagline}</p>
            <div className="hero-facts">
              <span><CalendarDays size={16} /> Best time: {destination.bestTime}</span>
              <span><Clock3 size={16} /> Ideal for {destination.idealDays} days</span>
              <span><IndianRupee size={16} /> From {formatCurrency(destination.fromPrice)}</span>
            </div>
            <div className="hero-actions">
              <Link to={`/plan?destination=${destination.slug}`} className="btn btn-primary btn-large">
                Estimate this trip <ArrowRight size={17} />
              </Link>
              <a href="#providers" className="btn btn-outline-light btn-large">See local providers</a>
            </div>
          </div>
        </div>
        <span className="image-credit">Photo: {destination.imageCredit}</span>
      </section>

      <section className="section section-tight">
        <div className="container detail-grid">
          <div className="detail-main">
            <div className="prose-card">
              <span className="eyebrow"><Sparkles size={15} /> About {destination.name}</span>
              <h2>Why travellers love {destination.name}</h2>
              <p>{destination.description}</p>
              <div className="tag-row">
                {destination.tags.map((tag) => <Badge key={tag} tone="soft">{tag}</Badge>)}
              </div>
            </div>

            <div className="places-section">
              <SectionHeading
                eyebrow="Famous places"
                title={`Must-see places in ${destination.name}`}
                description="Tap a photo to read what makes each stop worth your time."
              />
              <div className="place-feature">
                {activePlace && (
                  <div className="place-feature-main">
                    <img src={activePlace.image} alt={activePlace.name} />
                    <div className="place-feature-copy">
                      <Badge tone="mint">{activePlace.category}</Badge>
                      <h3>{activePlace.name}</h3>
                      <p>{activePlace.description}</p>
                      <div className="place-facts">
                        <span><Clock3 size={14} /> {activePlace.duration}</span>
                        <span><Ticket size={14} /> {activePlace.entryFee ? `₹${activePlace.entryFee} entry` : 'Free entry'}</span>
                        <span><Sparkles size={14} /> {activePlace.bestTime}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="place-thumb-rail">
                  {destination.places.map((place) => (
                    <button
                      type="button"
                      key={place.id}
                      className={`place-thumb ${activePlace?.id === place.id ? 'active' : ''}`}
                      onClick={() => setActivePlace(place)}
                    >
                      <img src={place.image} alt={place.name} loading="lazy" />
                      <span>{place.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="place-list">
                {destination.places.map((place) => (
                  <article className="place-row" key={place.id}>
                    <img src={place.image} alt={place.name} loading="lazy" />
                    <div>
                      <div className="place-row-head">
                        <h3>{place.name}</h3>
                        <Badge tone="neutral">{place.category}</Badge>
                      </div>
                      <p>{place.description}</p>
                      <div className="place-facts">
                        <span><Clock3 size={14} /> {place.duration}</span>
                        <span><Ticket size={14} /> {place.entryFee ? `₹${place.entryFee}` : 'Free'}</span>
                        <span><MapPin size={14} /> {place.highlight}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="providers-section" id="providers">
              <SectionHeading
                eyebrow="Local providers"
                title={`Guides, transport & stays in ${destination.name}`}
                description="Booking requests are sent directly to the provider — no middlemen."
                action={<Link to={`/services?destination=${destination.slug}`} className="btn btn-outline btn-small">All services <ArrowRight size={15} /></Link>}
              />
              {services.length === 0 ? (
                <EmptyState
                  icon="briefcase"
                  title="No providers listed yet"
                  description="Provider accounts can publish guide, transport and hotel services for this destination."
                  action={<Link to="/register?role=guide" className="btn btn-primary btn-small">Become a provider</Link>}
                />
              ) : (
                <div className="service-grid service-grid-compact">
                  {services.map((service) => <ServiceCard key={service.id} service={service} />)}
                </div>
              )}
            </div>
          </div>

          <aside className="detail-sidebar">
            <div className="sidebar-card">
              <h3><IndianRupee size={18} /> Typical daily costs</h3>
              <p className="sidebar-note">Indicative per day for one traveller, in INR.</p>
              <div className="cost-list">
                {dailyCosts.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{formatCurrency(item.value)}</strong>
                  </div>
                ))}
              </div>
              <Link to={`/plan?destination=${destination.slug}`} className="btn btn-primary btn-full">Build an estimate</Link>
            </div>

            <div className="sidebar-card">
              <h3><ShieldCheck size={18} /> Good to know</h3>
              <div className="info-list">
                <div><Mountain size={16} /><span><small>Weather</small>{destination.weather}</span></div>
                <div><Users size={16} /><span><small>Languages</small>{destination.languages.join(', ')}</span></div>
                <div><Languages size={16} /><span><small>Safety tip</small>{destination.safetyTip}</span></div>
                <div><CalendarDays size={16} /><span><small>Best season</small>{destination.bestTime}</span></div>
              </div>
            </div>

            <div className="sidebar-card sidebar-cta">
              <h3>Travel your way</h3>
              <p>Need a guide only? A cab only? Or the full package? Toggle services on or off in the estimator.</p>
              <Link to="/plan" className="btn btn-dark btn-full">Open trip planner</Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default DestinationDetail;
