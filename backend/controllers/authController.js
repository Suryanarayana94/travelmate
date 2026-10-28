const User = require('../models/User');
const { ROLES } = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/errors');
const { signToken } = require('../middleware/auth');
const { userView, sendSuccess } = require('../views/responseView');
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../middleware/upload');

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  }
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
      }
    } catch {
      // Fall through to comma-separated parsing.
    }
  }
  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
};

const pickProfileFields = (body, user, { includeEmail = true } = {}) => {
  const stringFields = ['name', 'phone', 'city', 'state', 'bio', 'website'];
  const listFields = ['languages', 'specialities', 'vehicleTypes', 'serviceAreas', 'amenities'];
  const numberFields = ['experienceYears', 'dailyRate'];
  const enumFields = ['hotelCategory'];

  for (const field of stringFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      user[field] = String(body[field] || '').trim();
    }
  }

  if (includeEmail && Object.prototype.hasOwnProperty.call(body, 'email')) {
    user.email = String(body.email || '').trim().toLowerCase();
  }

  for (const field of listFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      user[field] = parseList(body[field]);
    }
  }

  for (const field of numberFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const number = Number(body[field]);
      user[field] = Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
    }
  }

  for (const field of enumFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      user[field] = String(body[field] || '').trim();
    }
  }

  return user;
};

const deleteOldProfileImage = (profileImage) => {
  if (!profileImage || !profileImage.startsWith('/uploads/')) return;
  const fileName = path.basename(profileImage);
  const filePath = path.join(uploadsDir, fileName);
  if (filePath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  if (String(password).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }
  if (role && !ROLES.includes(role)) {
    throw new ApiError(400, 'Choose a valid account role');
  }

  const normalisedEmail = String(email).trim().toLowerCase();
  const exists = await User.findOne({ email: normalisedEmail });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = new User({
    name: String(name).trim(),
    email: normalisedEmail,
    passwordHash: String(password),
    role: role || 'traveller'
  });
  pickProfileFields(req.body, user, { includeEmail: false });
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);
  sendSuccess(
    res,
    { user: userView(user), token },
    { status: 201, message: 'Welcome to TravelMate! Your account has been created.' }
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select(
    '+passwordHash'
  );
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user._id);

  sendSuccess(res, { user: userView(user), token }, { message: `Welcome back, ${user.name.split(' ')[0]}!` });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: userView(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
    const nextEmail = String(req.body.email || '').trim().toLowerCase();
    if (nextEmail !== user.email) {
      const exists = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (exists) throw new ApiError(409, 'That email is already linked to another account');
    }
  }

  pickProfileFields(req.body, user);

  if (req.file) {
    deleteOldProfileImage(user.profileImage);
    user.profileImage = `/uploads/${req.file.filename}`;
  }

  await user.save();
  sendSuccess(res, { user: userView(user) }, { message: 'Profile updated successfully' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new passwords are required');
  }
  if (String(newPassword).length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long');
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.comparePassword(String(currentPassword)))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.passwordHash = String(newPassword);
  await user.save();
  sendSuccess(res, null, { message: 'Password changed successfully' });
});

module.exports = { register, login, me, updateProfile, changePassword, parseList };
