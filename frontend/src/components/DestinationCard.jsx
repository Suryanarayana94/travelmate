import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { Badge } from './ui';

const DestinationCard = ({ destination, index = 0 }) => (
  <article className="destination-card reveal" style={{ animationDelay: `${Math.min(index, 6) * 65}ms` }}>
    <Link to={`/destinations/${destination.slug}`} className="destination-image-link">
      <img src={destination.heroImage} alt={destination.heroAlt || destination.name} loading="lazy" />
      <span className="image-shade" />
      <span className="destination-state"><MapPin size={13} /> {destination.state}</span>
      <span className="destination-rating"><Star size={13} fill="currentColor" /> {destination.rating}</span>
    </Link>
    <div className="destination-card-body">
      <div className="destination-title-row">
        <h3>{destination.name}</h3>
        <span className="place-count">{destination.places?.length || 0} famous places</span>
      </div>
      <p>{destination.tagline}</p>
      <div className="tag-row">
        {(destination.tags || []).slice(0, 3).map((tag) => (
          <Badge key={tag} tone="soft">{tag}</Badge>
        ))}
      </div>
      <div className="destination-card-footer">
        <div>
          <small>Estimated from</small>
          <strong>{formatCurrency(destination.fromPrice)}</strong>
        </div>
        <Link to={`/plan?destination=${destination.slug}`} className="circle-link" aria-label={`Plan a trip to ${destination.name}`}>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  </article>
);

export default DestinationCard;
