import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
  jobDescriptionHash: { type: String, required: true, trim: true },
  scores: { type: mongoose.Schema.Types.Mixed, required: true },
  matchedSkills: [{ type: String, trim: true, maxlength: 100 }],
  missingSkills: [{ type: String, trim: true, maxlength: 100 }],
  additionalSkills: [{ type: String, trim: true, maxlength: 100 }],
  gaps: [{
    item: { type: String, required: true, trim: true, maxlength: 160 },
    importance: { type: String, enum: ['required', 'preferred'], required: true },
    explanation: { type: String, required: true, trim: true, maxlength: 500 }
  }],
  explanation: { type: String, required: true, trim: true, maxlength: 1800 },
  recommendation: { type: String, required: true, trim: true, maxlength: 1000 },
  model: { type: String, required: true },
  promptVersion: { type: String, required: true }
}, {
  timestamps: true,
  versionKey: false
});

matchSchema.index({ user: 1, resume: 1, job: 1, analysis: 1, jobDescriptionHash: 1, createdAt: -1 });
matchSchema.index({ user: 1, createdAt: -1 });

const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
export default Match;
