const Destination = require('../models/Destination');
const { ApiError, asyncHandler } = require('../middleware/errors');
const { destinationView, sendSuccess } = require('../views/responseView');

const listDestinations = asyncHandler(async (req, res) => {
  const { q, region, state, tag, sort = 'popular', limit = 50 } = req.query;
  const filter = { active: true };

  if (q) {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: regex },
      { state: regex },
      { region: regex },
      { tagline: regex },
      { tags: regex }
    ];
  }
  if (region) filter.region = String(region);
  if (state) filter.state = String(state);
  if (tag) filter.tags = { $in: [String(tag)] };

  const sortMap = {
    popular: { rating: -1, fromPrice: 1 },
    'price-low': { fromPrice: 1, rating: -1 },
    'price-high': { fromPrice: -1, rating: -1 },
    name: { name: 1 }
  };

  const max = Math.min(100, Math.max(1, Number(limit) || 50));
  const [items, total, regions, states] = await Promise.all([
    Destination.find(filter).sort(sortMap[sort] || sortMap.popular).limit(max),
    Destination.countDocuments(filter),
    Destination.distinct('region', { active: true }),
    Destination.distinct('state', { active: true })
  ]);

  sendSuccess(res, items.map(destinationView), {
    meta: { total, count: items.length, regions, states, sort }
  });
});

const getDestinationBySlug = asyncHandler(async (req, res) => {
  const destination = await Destination.findOne({ slug: req.params.slug, active: true });
  if (!destination) throw new ApiError(404, 'Destination not found');
  sendSuccess(res, destinationView(destination));
});

module.exports = { listDestinations, getDestinationBySlug };
