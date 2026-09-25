import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 300 },
  required: { type: Boolean, required: true },
  category: { type: String, enum: ['skill', 'experience', 'education', 'certification', 'language', 'other'], required: true }
}, { _id: false });

const jobAnalysisSchema = new mongoose.Schema({
  summary: { type: String, required: true, trim: true, maxlength: 1000 },
  skills: [{ type: String, trim: true, maxlength: 100 }],
  keywords: [{ type: String, trim: true, maxlength: 100 }],
  responsibilities: [{ type: String, trim: true, maxlength: 400 }],
  requirements: { type: [requirementSchema], default: [] },
  experienceRequirements: { type: String, trim: true, maxlength: 500 },
  educationRequirements: { type: String, trim: true, maxlength: 500 },
  languageRequirements: [{ type: String, trim: true, maxlength: 160 }],
  sourceEvidence: [{ type: String, maxlength: 240 }],
  model: { type: String, required: true },
  analyzedAt: { type: Date, required: true }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  company: { type: String, trim: true, maxlength: 120, default: '' },
  location: { type: String, trim: true, maxlength: 160, default: '' },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'] },
  description: { type: String, required: true, trim: true, minlength: 80, maxlength: 30000 },
  descriptionHash: { type: String, required: true, select: false },
  url: { type: String, trim: true, maxlength: 2048 },
  skills: [{ type: String, trim: true, maxlength: 100 }],
  notes: { type: String, trim: true, maxlength: 2000, default: '' },
  source: { type: String, enum: ['manual'], default: 'manual' },
  jobAnalysis: { type: jobAnalysisSchema }
}, {
  timestamps: true,
  versionKey: false
});

jobSchema.set('toJSON', {
  transform(_document, returned) {
    delete returned.descriptionHash;
    return returned;
  }
});

jobSchema.index({ user: 1, createdAt: -1 });
jobSchema.index({ user: 1, title: 1 });

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
export default Job;
