import { MapPin, Star, Users } from 'lucide-react';
import { PRICE_UNITS } from '../lib/constants';
import { formatCurrency } from '../lib/format';
import { Avatar, Badge } from './ui';

const typeLabels = { guide: 'Travel guide', transport: 'Transport', hotel: 'Stay' };
const typeTones = { guide: 'amber', transport: 'blue', hotel: 'violet' };

const ServiceCard = ({ service, onBook, buttonLabel = 'Request booking' }) => {
  const unit = PRICE_UNITS.find((item) => item.value === service.price?.unit)?.label || 'per service';
  return (
    <article className="service-card">
      <div className="service-image-wrap">
        <img src={service.image} alt={service.title} loading="lazy" />
        <Badge tone={typeTones[service.type]} className="service-type-badge">{typeLabels[service.type]}</Badge>
      </div>
      <div className="service-card-body">
        <div className="service-meta-top">
          <RatingInline value={service.rating} reviews={service.reviews} />
          <span><MapPin size={13} /> {service.city || service.destinationSlug}</span>
        </div>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <div className="tag-row">
          {(service.tags || []).slice(0, 3).map((tag) => <Badge key={tag} tone="soft">{tag}</Badge>)}
        </div>
        {service.owner && (
          <div className="service-owner">
            <Avatar user={service.owner} size={32} />
            <div>
              <strong>{service.owner.name}</strong>
              {service.owner.verified && <span className="verified"><Star size={11} fill="currentColor" /> Verified</span>}
            </div>
          </div>
        )}
        <div className="service-card-footer">
          <div className="service-price">
            <strong>{formatCurrency(service.price?.amount)}</strong>
            <small>{unit}</small>
          </div>
          <span className="capacity"><Users size={13} /> up to {service.capacity}</span>
          {onBook && (
            <button type="button" className="btn btn-primary btn-small" onClick={() => onBook(service)}>
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

const RatingInline = ({ value, reviews }) => (
  <span className="rating rating-dark">
    <Star size={13} fill="currentColor" /> <strong>{Number(value || 0).toFixed(1)}</strong>
    {reviews !== undefined && <span>({reviews})</span>}
  </span>
);

export default ServiceCard;
