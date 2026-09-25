import mongoose from 'mongoose';

const scoreCategorySchema = new mongoose.Schema({
  score: { type: Number, required: true, min: 0, max: 100 },
  weight: { type: Number, required: true, min: 0, max: 100 },
  weightedPoints: { type: Number, required: true, min: 0, max: 100 },
  label: { type: String, required: true },
  explanation: { type: String, required: true, maxlength: 600 },
  evidence: [{ type: String, maxlength: 240 }]
}, { _id: false });

const scoreSchema = new mongoose.Schema({
  overall: {
    score: { type: Number, required: true, min: 0, max: 100 },
    label: { type: String, required: true },
    formula: { type: String, required: true }
  },
  categories: { type: Map, of: scoreCategorySchema, required: true },
  generatedBy: { type: String, required: true },
  disclaimer: { type: String, required: true }
}, { _id: false });

const insightSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  explanation: { type: String, required: true, trim: true, maxlength: 600 },
  evidence: [{ type: String, maxlength: 240 }],
  priority: { type: String, enum: ['high', 'medium', 'low'] }
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  summary: { type: String, required: true, trim: true, maxlength: 1200 },
  information: { type: mongoose.Schema.Types.Mixed, required: true },
  scores: { type: scoreSchema, required: true },
  strengths: { type: [insightSchema], default: [] },
  improvements: { type: [insightSchema], default: [] },
  recommendations: [{ type: String, trim: true, maxlength: 400 }],
  model: { type: String, required: true, trim: true, maxlength: 120 },
  promptVersion: { type: String, required: true },
  disclaimer: { type: String, required: true }
}, {
  timestamps: true,
  versionKey: false
});

analysisSchema.index({ user: 1, resume: 1, createdAt: -1 });
analysisSchema.index({ user: 1, createdAt: -1 });

const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema);
export default Analysis;
