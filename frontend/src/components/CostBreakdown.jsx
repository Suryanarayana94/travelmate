import { IndianRupee, Info, MapPin, Users } from 'lucide-react';
import { formatCurrency, formatDate, pluralise } from '../lib/format';
import { Spinner } from './ui';

const CostBreakdown = ({ result, loading, onSave, saving, saved, showSave = true }) => {
  if (loading) {
    return (
      <div className="cost-panel cost-loading">
        <Spinner size={28} />
        <h3>Calculating your trip...</h3>
        <p>Measuring distance and building an itemised estimate.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="cost-panel cost-loading">
        <IndianRupee size={32} />
        <h3>Your estimate appears here</h3>
        <p>Choose a boarding point and destination to see a transparent cost breakdown.</p>
      </div>
    );
  }

  const { estimate, options, boardingPoint, destination } = result;
  return (
    <div className="cost-panel">
      <div className="cost-panel-head">
        <div>
          <span className="eyebrow">Estimated trip total</span>
          <h2>{formatCurrency(estimate.total)}</h2>
          <p>{formatCurrency(estimate.perPerson)} per traveller · {pluralise(options.travelers, 'traveller')}</p>
        </div>
        <div className="cost-seal"><IndianRupee size={26} /></div>
      </div>

      <div className="cost-route">
        <div><MapPin size={15} /><span><small>From</small><strong>{boardingPoint.name}</strong></span></div>
        <span className="route-line" />
        <div><MapPin size={15} /><span><small>To</small><strong>{destination.name}</strong></span></div>
      </div>

      <div className="cost-summary-row">
        <span><Users size={14} /> {pluralise(options.travelers, 'traveller')}</span>
        <span>{pluralise(options.days, 'day')}</span>
        <span>{formatDate(options.startDate)}</span>
        <span>{estimate.roadDistanceKm.toLocaleString('en-IN')} km one way</span>
      </div>

      <div className="line-items">
        {estimate.lineItems.map((item) => (
          <div className="line-item" key={item.key}>
            <div>
              <strong>{item.label}</strong>
              <small>{item.details}</small>
            </div>
            <span>{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className="cost-totals">
        <div><span>Subtotal</span><strong>{formatCurrency(estimate.subtotal)}</strong></div>
        <div><span>Taxes & booking fees (5%)</span><strong>{formatCurrency(estimate.taxes)}</strong></div>
        <div><span>Contingency buffer (5%)</span><strong>{formatCurrency(estimate.contingency)}</strong></div>
        <div className="grand-total"><span>Total estimate</span><strong>{formatCurrency(estimate.total)}</strong></div>
      </div>

      <details className="assumptions">
        <summary><Info size={15} /> How this estimate is calculated</summary>
        <ul>
          {(estimate.assumptions || []).map((item) => <li key={item}>{item}</li>)}
          <li>{estimate.disclaimer}</li>
        </ul>
      </details>

      {showSave && onSave && (
        <button type="button" className="btn btn-primary btn-full" onClick={onSave} disabled={saving || saved}>
          {saving ? <><Spinner size={16} /> Saving plan...</> : saved ? 'Saved to dashboard' : 'Save this trip plan'}
        </button>
      )}
      <p className="cost-disclaimer">Planning estimate only. Confirm live prices with providers before payment.</p>
    </div>
  );
};

export default CostBreakdown;
