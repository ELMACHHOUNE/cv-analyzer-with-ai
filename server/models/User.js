import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  targetRole: { type: String, trim: true, maxlength: 120, default: '' },
  preferredLanguage: { type: String, enum: ['en', 'ar', 'fr'], default: 'en' },
  theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  tokenVersion: { type: Number, default: 0, min: 0 },
  settings: { type: settingsSchema, default: () => ({}) }
}, {
  timestamps: true,
  versionKey: false
});

userSchema.set('toJSON', {
  transform(_document, returned) {
    delete returned.passwordHash;
    return returned;
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
