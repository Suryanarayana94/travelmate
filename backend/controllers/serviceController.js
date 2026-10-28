const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const Service = require('../models/Service');
const { SERVICE_TYPES, PRICE_UNITS } = require('../models/Service');
const { ApiError, asyncHandler } = require('../middleware/errors');
const { serviceView, sendSuccess } = require('../views/responseView');

const asList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20);
  }
  return [];
};

const asPositive = (value, fallback, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const ensureDestination = async (slug) => {
  const destination = await Destination.findOne({ slug: String(slug || '').toLowerCase(), active: true });
  if (!destination) throw new ApiError(400, 'Choose a valid TravelMate destination');
  return destination;
};

const buildServiceFields = (body, existing = {}) => {
  const price = body.price && typeof body.price === 'object' ? body.price : {};
  const fields = { ...existing };

  if (body.title !== undefined) fields.title = String(body.title).trim();
  if (body.description !== undefined) fields.description = String(body.description).trim();
  if (body.city !== undefined) fields.city = String(body.city || '').trim();
  if (body.image !== undefined) fields.image = String(body.image || '').trim();
  if (body.contactPhone !== undefined) fields.contactPhone = String(body.contactPhone || '').trim();
  if (body.contactEmail !== undefined) fields.contactEmail = String(body.contactEmail || '').trim().toLowerCase();
  if (body.languages !== undefined) fields.languages = asList(body.languages);
  if (body.tags !== undefined) fields.tags = asList(body.tags);
  if (body.capacity !== undefined) fields.capacity = asPositive(body.capacity, 1, 1, 100);
  if (body.availability !== undefined) fields.availability = Boolean(body.availability);

  const amount = price.amount ?? body.priceAmount;
  const unit = price.unit ?? body.priceUnit;
  if (amount !== undefined) {
    fields.price = {
      amount: Math.max(0, Math.round(Number(amount) || 0)),
      unit: PRICE_UNITS.includes(unit) ? unit : fields.price?.unit || 'day'
    };
  }
  if (unit !== undefined && PRICE_UNITS.includes(unit) && fields.price) {
    fields.price.unit = unit;
  }

  return fields;
};

const listServices = asyncHandler(async (req, res) => {
  const { type, destinationSlug, q, minPrice, maxPrice, sort = 'featured', limit = 60 } = req.query;
  const filter = { availability: true };

  if (type) {
    if (!SERVICE_TYPES.includes(String(type))) throw new ApiError(400, 'Invalid service type');
    filter.type = String(type);
  }
  if (destinationSlug) filter.destinationSlug = String(destinationSlug).toLowerCase();
  if (q) {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { tags: regex }, { city: regex }];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['price.amount'] = {};
    if (minPrice !== undefined) filter['price.amount'].$gte = Number(minPrice) || 0;
    if (maxPrice !== undefined) filter['price.amount'].$lte = Number(maxPrice) || 1000000;
  }

  const sortMap = {
    featured: { featured: -1, rating: -1, createdAt: -1 },
    'price-low': { 'price.amount': 1, rating: -1 },
    'price-high': { 'price.amount': -1, rating: -1 },
    rating: { rating: -1, reviews: -1 },
    newest: { createdAt: -1 }
  };

  const max = Math.min(100, Math.max(1, Number(limit) || 60));
  const items = await Service.find(filter)
    .populate('owner', 'name role city phone email profileImage verified')
    .sort(sortMap[sort] || sortMap.featured)
    .limit(max);

  sendSuccess(res, items.map(serviceView), { meta: { count: items.length, sort } });
});

const getServiceById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid service id');
  const service = await Service.findById(req.params.id).populate(
    'owner',
    'name role city phone email profileImage verified'
  );
  if (!service) throw new ApiError(404, 'Service not found');
  sendSuccess(res, serviceView(service));
});

const getMyServices = asyncHandler(async (req, res) => {
  const items = await Service.find({ owner: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, items.map(serviceView), { meta: { count: items.length } });
});

const createService = asyncHandler(async (req, res) => {
  if (!SERVICE_TYPES.includes(req.user.role)) {
    throw new ApiError(403, 'Only guide, transport and hotel accounts can publish services');
  }

  const type = String(req.body.type || req.user.role);
  if (type !== req.user.role) {
    throw new ApiError(400, `Your ${req.user.role} account can only publish ${req.user.role} services`);
  }

  const destinationSlug = String(req.body.destinationSlug || '').toLowerCase();
  const destination = await ensureDestination(destinationSlug);
  const fields = buildServiceFields(req.body);

  if (!fields.title || !fields.description) {
    throw new ApiError(400, 'Service title and description are required');
  }
  if (!fields.price || fields.price.amount <= 0) {
    throw new ApiError(400, 'Enter a valid service price');
  }

  const service = await Service.create({
    ...fields,
    owner: req.user._id,
    type,
    destinationSlug,
    image: fields.image || destination.heroImage,
    city: fields.city || destination.name,
    contactPhone: fields.contactPhone || req.user.phone,
    contactEmail: fields.contactEmail || req.user.email
  });

  sendSuccess(res, serviceView(service), { status: 201, message: 'Service published successfully' });
});

const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, owner: req.user._id });
  if (!service) throw new ApiError(404, 'Service not found or you cannot edit it');

  if (req.body.destinationSlug !== undefined) {
    const destination = await ensureDestination(req.body.destinationSlug);
    service.destinationSlug = destination.slug;
    if (!service.image) service.image = destination.heroImage;
  }

  const fields = buildServiceFields(req.body, {
    title: service.title,
    description: service.description,
    price: service.price,
    city: service.city,
    image: service.image,
    contactPhone: service.contactPhone,
    contactEmail: service.contactEmail,
    languages: service.languages,
    tags: service.tags,
    capacity: service.capacity,
    availability: service.availability
  });

  Object.assign(service, fields);
  await service.save();
  sendSuccess(res, serviceView(service), { message: 'Service updated successfully' });
});

const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!service) throw new ApiError(404, 'Service not found or you cannot delete it');
  sendSuccess(res, null, { message: 'Service removed' });
});

module.exports = {
  listServices,
  getServiceById,
  getMyServices,
  createService,
  updateService,
  deleteService
};
