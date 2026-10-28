const ROLE_LABELS = {
  traveller: 'Traveller',
  guide: 'Travel Guide',
  transport: 'Transport Agency',
  hotel: 'Hotel'
};

const objectId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id?.toString?.() || value.toString();
};

const toPlain = (document) => {
  if (!document) return null;
  if (typeof document.toObject === 'function') return document.toObject({ virtuals: true });
  return { ...document };
};

const userView = (document) => {
  const user = toPlain(document);
  if (!user) return null;
  delete user.passwordHash;
  delete user.__v;
  return {
    ...user,
    id: objectId(user._id || user.id),
    roleLabel: ROLE_LABELS[user.role] || user.role,
    profileCompletion:
      typeof user.profileCompletion === 'number'
        ? user.profileCompletion
        : Math.round(
            ([user.name, user.email, user.phone, user.city, user.bio, user.profileImage].filter(Boolean)
              .length /
              6) *
              100
          )
  };
};

const destinationView = (document) => {
  const item = toPlain(document);
  if (!item) return null;
  item.id = objectId(item._id || item.id);
  delete item._id;
  delete item.__v;
  return item;
};

const serviceView = (document) => {
  const item = toPlain(document);
  if (!item) return null;
  item.id = objectId(item._id || item.id);
  item.ownerId = objectId(item.owner?._id || item.owner);
  if (item.owner && typeof item.owner === 'object') {
    item.owner = {
      id: objectId(item.owner._id || item.owner.id),
      name: item.owner.name,
      role: item.owner.role,
      city: item.owner.city,
      phone: item.owner.phone,
      email: item.owner.email,
      profileImage: item.owner.profileImage,
      verified: item.owner.verified
    };
  }
  delete item._id;
  delete item.__v;
  return item;
};

const tripView = (document) => {
  const item = toPlain(document);
  if (!item) return null;
  item.id = objectId(item._id || item.id);
  item.ownerId = objectId(item.owner?._id || item.owner);
  // days/travellers live at the top level of the document; mirror them into
  // options so clients can render the whole plan from one object.
  item.options = { ...(item.options || {}), days: item.days, travelers: item.travelers };
  delete item._id;
  delete item.__v;
  delete item.owner;
  return item;
};

const bookingView = (document) => {
  const item = toPlain(document);
  if (!item) return null;
  item.id = objectId(item._id || item.id);
  item.travellerId = objectId(item.traveller?._id || item.traveller);
  item.providerId = objectId(item.provider?._id || item.provider);
  item.serviceId = objectId(item.service?._id || item.service);
  if (item.traveller && typeof item.traveller === 'object') {
    item.traveller = userView(item.traveller);
  }
  if (item.service && typeof item.service === 'object') {
    item.service = serviceView(item.service);
  }
  delete item._id;
  delete item.__v;
  return item;
};

const sendSuccess = (res, data, { message = 'OK', status = 200, meta } = {}) =>
  res.status(status).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {})
  });

module.exports = {
  ROLE_LABELS,
  userView,
  destinationView,
  serviceView,
  tripView,
  bookingView,
  sendSuccess
};
