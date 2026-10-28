import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  CarFront,
  Compass,
  IndianRupee,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star
} from 'lucide-react';
import DestinationCard from '../components/DestinationCard';
import { InlineNotice, SectionHeading, SkeletonGrid } from '../components/ui';
import { api } from '../lib/api';
import { ROLES } from '../lib/constants';
import { addDays, formatCurrency } from '../lib/format';

const roleIcons = { traveller: Compass, guide: Route, transport: CarFront, hotel: BedDouble };

const Home = () => {
  const [destinations, setDestinations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/destinations?limit=6'), api.get('/meta', { auth: false })])
      .then(([destinationResponse, metaResponse]) => {
        if (!active) return;
        setDestinations(destinationResponse.data);
        setMeta(metaResponse.data);
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
  }, []);

  const popularPlaces = useMemo(
    () =>
      destinations.flatMap((destination) =>
        (destination.places || []).slice(0, 2).map((place) => ({
          ...place,
          destinationName: destination.name,
          destinationSlug: destination.slug
        }))
      ).slice(0, 8),
    [destinations]
  );

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><Sparkles size={15} /> India, planned beautifully</span>
            <h1>Explore India with a plan that <em>adds up.</em></h1>
            <p>
              Pick a destination, choose a guide, transport and stay only if you need them, and get a
              clear trip estimate from your boarding point — all in one place.
            </p>
            <div className="hero-actions">
              <Link to="/plan" className="btn btn-primary btn-large">
                Estimate my trip <ArrowRight size={18} />
              </Link>
              <Link to="/destinations" className="btn btn-outline btn-large">
                Browse destinations
              </Link>
            </div>
            <div className="hero-stats">
              <div><strong>{destinations.length ? `${destinations.length}+` : '6'}</strong><span>Curated destinations</span></div>
              <div><strong>{destinations.reduce((sum, item) => sum + (item.places?.length || 0), 0) || 24}</strong><span>Famous places mapped</span></div>
              <div><strong>4</strong><span>Role dashboards</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-photo-stack">
              <img className="hero-photo hero-photo-main" src="/images/places/taj-mahal.jpg" alt="Taj Mahal, Agra" />
              <img className="hero-photo hero-photo-top" src="/images/places/alleppey-backwaters.jpg" alt="Kerala backwaters houseboat" />
              <img className="hero-photo hero-photo-bottom" src="/images/places/solang-valley.jpg" alt="Solang Valley near Manali" />
            </div>
            <div className="hero-estimate-card">
              <div className="mini-card-head">
                <span className="mini-icon"><IndianRupee size={18} /></span>
                <div>
                  <small>Sample estimate</small>
                  <strong>Hyderabad → Goa · 4 days</strong>
                </div>
              </div>
              <div className="mini-progress"><span style={{ width: '72%' }} /></div>
              <div className="mini-card-row"><span>2 travellers, standard stay</span><strong>{formatCurrency(46084)}</strong></div>
              <div className="mini-card-foot"><span className="dot" /> Itemised, no surprises</div>
            </div>
            <div className="hero-chip hero-chip-one"><MapPin size={15} /> Fort Aguada</div>
            <div className="hero-chip hero-chip-two"><Star size={15} fill="currentColor" /> Local guides</div>
          </div>
        </div>

        <div className="container">
          <form className="quick-search" action="/destinations" method="get">
            <div className="quick-field">
              <MapPin size={18} />
              <label>
                <span>Where to?</span>
                <input name="q" placeholder="Goa, Jaipur, Kerala..." autoComplete="off" />
              </label>
            </div>
            <div className="quick-field">
              <CalendarDays size={18} />
              <label>
                <span>Starting from</span>
                <input name="from" placeholder="Your city" autoComplete="off" />
              </label>
            </div>
            <div className="quick-field">
              <Compass size={18} />
              <label>
                <span>Need on the ground</span>
                <select name="need" defaultValue="all">
                  <option value="all">Guide, transport, hotels</option>
                  <option value="guide">Travel guide</option>
                  <option value="transport">Transport</option>
                  <option value="hotel">Hotel</option>
                </select>
              </label>
            </div>
            <button type="submit" className="btn btn-dark btn-search"><Search size={18} /> Search</button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Popular right now"
            title="Destinations worth the detour"
            description="Every destination includes famous places with photos, best times and entry details."
            action={<Link to="/destinations" className="btn btn-outline btn-small">View all <ArrowRight size={15} /></Link>}
          />
          {error && <InlineNotice type="error">{error} Make sure the API server is running on port 5000.</InlineNotice>}
          {loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="destination-grid">
              {destinations.map((destination, index) => (
                <DestinationCard key={destination.slug} destination={destination} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <SectionHeading
            eyebrow="Famous places"
            title="Small stops that make the trip"
            description="From Goan forts to Kerala’s backwaters — each card links back to its destination."
          />
          <div className="place-mosaic">
            {popularPlaces.map((place) => (
              <Link to={`/destinations/${place.destinationSlug}`} key={`${place.destinationSlug}-${place.id}`} className="place-tile">
                <img src={place.image} alt={place.name} loading="lazy" />
                <span className="place-tile-shade" />
                <span className="place-tile-copy">
                  <small>{place.destinationName}</small>
                  <strong>{place.name}</strong>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <SectionHeading
            eyebrow="How TravelMate works"
            title="One platform, four ways to travel"
            description="Create a free account, then use the dashboard that fits you. Travellers plan; providers get discovered."
            align="center"
          />
          <div className="role-grid">
            {ROLES.map((role) => {
              const Icon = roleIcons[role.value] || Compass;
              return (
                <Link to={`/register?role=${role.value}`} key={role.value} className={`role-card role-${role.color}`}>
                  <span className="role-icon"><Icon size={24} /></span>
                  <h3>{role.label}</h3>
                  <p>{role.description}</p>
                  <span className="role-link">Create {role.label.toLowerCase()} account <ArrowRight size={15} /></span>
                </Link>
              );
            })}
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3><MapPin size={18} /> Choose where you’re going</h3>
              <p>Compare destinations, famous places, the best season and typical daily costs.</p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <h3><IndianRupee size={18} /> Estimate from your boarding point</h3>
              <p>Select your city, travel mode, days and whether you need a guide, cab or hotel.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <h3><ShieldCheck size={18} /> Book verified providers</h3>
              <p>Send booking requests directly to guides, transport agencies and hotels.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div>
              <span className="eyebrow">Ready when you are</span>
              <h2>Your next India trip starts with a number you can trust.</h2>
              <p>Try the estimator with live seeded destinations and see the full breakdown before you commit.</p>
            </div>
            <div className="cta-actions">
              <Link to="/plan" className="btn btn-primary btn-large">Plan a trip <ArrowRight size={18} /></Link>
              <Link to="/register" className="btn btn-outline-light btn-large">Create an account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-items">
          <span><Building2 size={17} /> Hotels & homestays</span>
          <span><CarFront size={17} /> Transport agencies</span>
          <span><Route size={17} /> Licensed local guides</span>
          <span><ShieldCheck size={17} /> Transparent estimates</span>
          <span><Compass size={17} /> {meta?.imageCredits?.count || 24} real destination photos</span>
        </div>
      </section>
    </div>
  );
};

export default Home;
