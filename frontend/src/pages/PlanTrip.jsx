import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  Compass,
  Fuel,
  IndianRupee,
  Info,
  MapPin,
  Minus,
  Plane,
  Plus,
  Route,
  Sparkles,
  TrainFront,
  Users
} from 'lucide-react';
import CostBreakdown from '../components/CostBreakdown';
import { InlineNotice, SectionHeading, Spinner, Toggle } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HOTEL_TIERS, TRANSPORT_MODES } from '../lib/constants';
import { addDays, formatCurrency, toDateInput } from '../lib/format';

const modeIcons = { bus: BusFront, train: TrainFront, flight: Plane, cab: CarFront, self: Fuel };

const PlanTrip = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [meta, setMeta] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [form, setForm] = useState({
    destinationSlug: searchParams.get('destination') || 'goa',
    boardingPoint: searchParams.get('from') || 'Hyderabad',
    startDate: addDays(14),
    days: 4,
    travelers: 2,
    needTransport: true,
    transportMode: 'train',
    needHotel: true,
    hotelTier: 'standard',
    rooms: 1,
    needGuide: false,
    guideDays: 2,
    mealPlan: true,
    includeActivities: true
  });
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/meta', { auth: false }), api.get('/destinations?limit=50', { auth: false })])
      .then(([metaResponse, destinationResponse]) => {
        if (!active) return;
        setMeta(metaResponse.data);
        setDestinations(destinationResponse.data);
      })
      .catch((requestError) => {
        if (active) setEstimateError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingMeta(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.slug === form.destinationSlug),
    [destinations, form.destinationSlug]
  );

  const requestBody = useMemo(
    () => ({
      destinationSlug: form.destinationSlug,
      boardingPoint: form.boardingPoint,
      days: form.days,
      travelers: form.travelers,
      startDate: form.startDate,
      options: {
        needTransport: form.needTransport,
        transportMode: form.transportMode,
        needHotel: form.needHotel,
        hotelTier: form.hotelTier,
        rooms: form.rooms,
        needGuide: form.needGuide,
        guideDays: form.guideDays,
        mealPlan: form.mealPlan,
        includeActivities: form.includeActivities
      }
    }),
    [form]
  );

  useEffect(() => {
    if (!form.boardingPoint.trim() || !form.destinationSlug) return undefined;
    const controller = new AbortController();
    setEstimating(true);
    setEstimateError('');
    setSaved(false);
    const timer = window.setTimeout(() => {
      api
        .post('/trips/estimate', requestBody, { auth: false, signal: controller.signal })
        .then((response) => setEstimate(response.data))
        .catch((requestError) => {
          if (requestError.name !== 'AbortError') {
            setEstimate(null);
            setEstimateError(requestError.message);
          }
        })
        .finally(() => setEstimating(false));
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestBody, form.boardingPoint, form.destinationSlug]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (form.destinationSlug) params.set('destination', form.destinationSlug);
    if (form.boardingPoint) params.set('from', form.boardingPoint);
    setSearchParams(params, { replace: true });
  }, [form.destinationSlug, form.boardingPoint, setSearchParams]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const step = (key, delta, min, max) =>
    setForm((current) => ({ ...current, [key]: Math.min(max, Math.max(min, Number(current[key]) + delta)) }));

  const savePlan = async () => {
    if (!user) {
      return toastError('Sign in to save this trip plan to your dashboard.');
    }
    if (user.role !== 'traveller') {
      return toastError('Trip plans are saved from a traveller account.');
    }
    setSaving(true);
    try {
      await api.post('/trips', { ...requestBody, notes: '' });
      setSaved(true);
      success('Trip plan saved to your traveller dashboard.');
    } catch (requestError) {
      toastError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const boardingOptions = meta?.boardingPoints || [];

  return (
    <div className="page-shell planner-page">
      <section className="page-banner planner-banner">
        <div className="container">
          <span className="eyebrow"><IndianRupee size={15} /> Trip cost estimator</span>
          <h1>Build your trip, see the real total</h1>
          <p>Every add-on is optional and itemised. Estimates update as you change your plan.</p>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container planner-grid">
          <div className="planner-form">
            <div className="form-card">
              <div className="form-card-head">
                <span className="step-badge">1</span>
                <div><h2>Where are you going?</h2><p>Choose a destination and your boarding city.</p></div>
              </div>

              <div className="destination-pills">
                {destinations.map((destination) => (
                  <button
                    key={destination.slug}
                    type="button"
                    className={`destination-pill ${form.destinationSlug === destination.slug ? 'active' : ''}`}
                    onClick={() => setField('destinationSlug', destination.slug)}
                  >
                    <img src={destination.heroImage} alt="" />
                    <span>{destination.name}<small>{destination.state}</small></span>
                  </button>
                ))}
                {loadingMeta && <Spinner />}
              </div>

              <div className="field-grid">
                <label className="field">
                  <span><MapPin size={15} /> Boarding point</span>
                  <input
                    list="boarding-points"
                    value={form.boardingPoint}
                    onChange={(event) => setField('boardingPoint', event.target.value)}
                    placeholder="City, town or station"
                  />
                  <datalist id="boarding-points">
                    {boardingOptions.map((point) => (
                      <option key={point.name} value={point.name}>{point.state}</option>
                    ))}
                  </datalist>
                </label>
                <label className="field">
                  <span><CalendarDays size={15} /> Start date</span>
                  <input
                    type="date"
                    min={toDateInput()}
                    value={form.startDate}
                    onChange={(event) => setField('startDate', event.target.value)}
                  />
                </label>
              </div>

              <div className="field-grid">
                <div className="field">
                  <span><Compass size={15} /> Days</span>
                  <div className="stepper">
                    <button type="button" onClick={() => step('days', -1, 1, 30)} aria-label="Fewer days"><Minus size={15} /></button>
                    <strong>{form.days}</strong>
                    <button type="button" onClick={() => step('days', 1, 1, 30)} aria-label="More days"><Plus size={15} /></button>
                  </div>
                </div>
                <div className="field">
                  <span><Users size={15} /> Travellers</span>
                  <div className="stepper">
                    <button type="button" onClick={() => step('travelers', -1, 1, 30)} aria-label="Fewer travellers"><Minus size={15} /></button>
                    <strong>{form.travelers}</strong>
                    <button type="button" onClick={() => step('travelers', 1, 1, 30)} aria-label="More travellers"><Plus size={15} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-head">
                <span className="step-badge">2</span>
                <div><h2>Do you need transport?</h2><p>We estimate return travel from your boarding point.</p></div>
              </div>
              <Toggle
                label="Include transport"
                description="Return journey, fuel/rail/flight fare and tolls where relevant"
                checked={form.needTransport}
                onChange={(value) => setField('needTransport', value)}
                name="needTransport"
              />
              <div className={`mode-grid ${form.needTransport ? '' : 'is-muted'}`}>
                {TRANSPORT_MODES.map((mode) => {
                  const Icon = modeIcons[mode.value] || CarFront;
                  return (
                    <button
                      type="button"
                      key={mode.value}
                      disabled={!form.needTransport}
                      className={`mode-card ${form.transportMode === mode.value ? 'active' : ''}`}
                      onClick={() => setField('transportMode', mode.value)}
                    >
                      <Icon size={20} />
                      <span>{mode.label}</span>
                      <small>{mode.hint}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-head">
                <span className="step-badge">3</span>
                <div><h2>Where will you stay?</h2><p>Skip this if you’re staying with friends or family.</p></div>
              </div>
              <Toggle
                label="Include hotel / stay"
                description="Estimated nightly rate for your chosen comfort level"
                checked={form.needHotel}
                onChange={(value) => setField('needHotel', value)}
                name="needHotel"
              />
              <div className={`tier-grid ${form.needHotel ? '' : 'is-muted'}`}>
                {HOTEL_TIERS.map((tier) => (
                  <button
                    type="button"
                    key={tier.value}
                    disabled={!form.needHotel}
                    className={`tier-card ${form.hotelTier === tier.value ? 'active' : ''}`}
                    onClick={() => setField('hotelTier', tier.value)}
                  >
                    <BedDouble size={18} />
                    <strong>{tier.label}</strong>
                    <small>{selectedDestination ? formatCurrency(selectedDestination.dailyCosts[`${tier.value}Hotel`]) : tier.hint} / night</small>
                  </button>
                ))}
              </div>
              {form.needHotel && (
                <div className="field-grid">
                  <div className="field">
                    <span><BedDouble size={15} /> Rooms</span>
                    <div className="stepper">
                      <button type="button" onClick={() => step('rooms', -1, 1, 15)} aria-label="Fewer rooms"><Minus size={15} /></button>
                      <strong>{form.rooms}</strong>
                      <button type="button" onClick={() => step('rooms', 1, 1, 15)} aria-label="More rooms"><Plus size={15} /></button>
                    </div>
                  </div>
                  <div className="field helper-field">
                    <Info size={15} />
                    <p>{Math.max(1, form.days - 1)} night{form.days - 1 === 1 ? '' : 's'} based on {form.days} days</p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-card">
              <div className="form-card-head">
                <span className="step-badge">4</span>
                <div><h2>Anything else?</h2><p>Guides and experiences are entirely optional.</p></div>
              </div>
              <Toggle
                label="Add a local travel guide"
                description="A licensed local expert for part of your trip"
                checked={form.needGuide}
                onChange={(value) => setField('needGuide', value)}
                name="needGuide"
              />
              {form.needGuide && (
                <div className="field-grid">
                  <div className="field">
                    <span><Route size={15} /> Guide days</span>
                    <div className="stepper">
                      <button type="button" onClick={() => step('guideDays', -1, 1, form.days)} aria-label="Fewer guide days"><Minus size={15} /></button>
                      <strong>{form.guideDays}</strong>
                      <button type="button" onClick={() => step('guideDays', 1, 1, form.days)} aria-label="More guide days"><Plus size={15} /></button>
                    </div>
                  </div>
                  <div className="field helper-field">
                    <Info size={15} />
                    <p>{selectedDestination ? `${formatCurrency(selectedDestination.dailyCosts.guide)} per day typical` : 'Typical local rate'}</p>
                  </div>
                </div>
              )}
              <Toggle
                label="Full meal plan"
                description="Turn off to estimate only essential meals"
                checked={form.mealPlan}
                onChange={(value) => setField('mealPlan', value)}
                name="mealPlan"
              />
              <Toggle
                label="Activities & monument entries"
                description="Entry tickets, water sports and experiences"
                checked={form.includeActivities}
                onChange={(value) => setField('includeActivities', value)}
                name="includeActivities"
              />
            </div>

            {selectedDestination && (
              <div className="planner-note">
                <img src={selectedDestination.heroImage} alt="" />
                <div>
                  <strong>{selectedDestination.name} · {selectedDestination.bestTime}</strong>
                  <p>{selectedDestination.safetyTip}</p>
                  <Link to={`/destinations/${selectedDestination.slug}`}>See famous places <ArrowRight size={14} /></Link>
                </div>
              </div>
            )}
          </div>

          <aside className="planner-side">
            {estimateError && <InlineNotice type="error">{estimateError}</InlineNotice>}
            <CostBreakdown
              result={estimate}
              loading={estimating && !estimate}
              onSave={savePlan}
              saving={saving}
              saved={saved}
            />
            {!user && (
              <div className="planner-login-hint">
                <Sparkles size={18} />
                <p><Link to="/login">Sign in</Link> or <Link to="/register">create a free account</Link> to save this plan to your traveller dashboard.</p>
              </div>
            )}
            <div className="planner-trust">
              <span><Check size={15} /> No hidden mark-up</span>
              <span><Check size={15} /> Optional add-ons</span>
              <span><Check size={15} /> Stored in MongoDB</span>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default PlanTrip;
