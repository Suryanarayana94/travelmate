const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('./errors');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new ApiError(500, 'JWT_SECRET must be configured in production');
  }
  return secret || 'travelmate-local-development-secret-change-me';
};

const signToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Please sign in to continue');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');

  req.user = user;
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Please sign in to continue'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Your dashboard role does not have access to this action'));
  }
  next();
};

module.exports = { signToken, protect, authorize, getJwtSecret };
