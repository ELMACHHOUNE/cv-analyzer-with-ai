import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  originalName: { type: String, required: true, trim: true, maxlength: 255 },
  storageName: { type: String, required: true, select: false },
  mimeType: { type: String, required: true, enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'] },
  size: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
  status: { type: String, required: true, enum: ['ready'], default: 'ready' },
  extractedText: { type: String, required: true, select: false },
  textHash: { type: String, required: true, select: false },
  characterCount: { type: Number, required: true, min: 1 },
  wordCount: { type: Number, required: true, min: 1 },
  pageCount: { type: Number, min: 0, default: 0 },
  extractionMethod: { type: String, required: true, enum: ['pdf-text', 'pdf-ocr', 'docx-text', 'image-ocr'] },
  analysisCount: { type: Number, min: 0, default: 0 },
  lastAnalyzedAt: { type: Date }
}, {
  timestamps: true,
  versionKey: false
});

resumeSchema.set('toJSON', {
  transform(_document, returned) {
    delete returned.storageName;
    delete returned.extractedText;
    delete returned.textHash;
    return returned;
  }
});

resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ user: 1, name: 1 });

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
export default Resume;
