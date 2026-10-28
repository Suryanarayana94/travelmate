const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['traveller', 'guide', 'transport', 'hotel'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address']
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'traveller', index: true },
    phone: { type: String, default: '', trim: true, maxlength: 20 },
    city: { type: String, default: '', trim: true, maxlength: 80 },
    state: { type: String, default: '', trim: true, maxlength: 80 },
    bio: { type: String, default: '', trim: true, maxlength: 800 },
    profileImage: { type: String, default: '' },
    languages: { type: [String], default: [] },
    specialities: { type: [String], default: [] },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    dailyRate: { type: Number, min: 0, default: 0 },
    vehicleTypes: { type: [String], default: [] },
    serviceAreas: { type: [String], default: [] },
    hotelCategory: {
      type: String,
      enum: ['', 'budget', 'standard', 'premium', 'heritage', 'homestay'],
      default: ''
    },
    amenities: { type: [String], default: [] },
    website: { type: String, default: '', trim: true },
    verified: { type: Boolean, default: false },
    lastLoginAt: { type: Date }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.virtual('profileCompletion').get(function profileCompletion() {
  const fields = [this.name, this.email, this.phone, this.city, this.bio, this.profileImage];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
