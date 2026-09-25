import path from 'node:path';
import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import Match from '../models/Match.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { presentResume } from '../utils/presenters.js';
import { extractDocument, removeStoredFile } from '../services/documentService.js';

async function cleanup(storageName) {
  if (storageName) {
    await removeStoredFile(storageName).catch(() => {});
  }
}

async function latestAnalysisByResume(userId, resumeIds) {
  const ids = [...new Set(resumeIds.filter(Boolean).map((id) => String(id)))];
  if (!ids.length) {
    return new Map();
  }
  const analyses = await Analysis.find({ user: userId, resume: { $in: ids } })
    .sort({ createdAt: -1 })
    .select('resume scores.overall createdAt');
  const latest = new Map();
  for (const analysis of analyses) {
    const key = String(analysis.resume);
    if (!latest.has(key)) {
      latest.set(key, analysis);
    }
  }
  return latest;
}

export const upload = asyncHandler(async (req, res) => {
  const storageName = req.file.storageName;
  try {
    const extracted = await extractDocument({
      storageName,
      mimeType: req.file.validatedMimeType
    });
    const name = req.validated?.body?.name || path.parse(req.file.originalName).name || 'CV';
    const resume = await Resume.create({
      user: req.user._id,
      name,
      originalName: req.file.originalName,
      storageName,
      mimeType: req.file.validatedMimeType,
      size: req.file.size,
      extractedText: extracted.text,
      textHash: extracted.textHash,
      characterCount: extracted.characterCount,
      wordCount: extracted.wordCount,
      pageCount: extracted.pageCount,
      extractionMethod: extracted.extractionMethod
    });
    return sendSuccess(res, { resume: presentResume(resume) }, 201);
  } catch (error) {
    await cleanup(storageName);
    throw error;
  }
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.validated.query;
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    Resume.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Resume.countDocuments(filter)
  ]);
  const latest = await latestAnalysisByResume(req.user._id, items.map((item) => item._id));
  return sendSuccess(res, {
    items: items.map((item) => presentResume(item, { analysis: latest.get(String(item._id)) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const get = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!resume) {
    throw new AppError('Resume not found', 404, 'RESUME_NOT_FOUND');
  }
  const latest = await latestAnalysisByResume(req.user._id, [resume._id]);
  return sendSuccess(res, { resume: presentResume(resume, { analysis: latest.get(String(resume._id)) }) });
});

export const update = asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndUpdate(
    { _id: req.validated.params.id, user: req.user._id },
    { $set: { name: req.validated.body.name } },
    { new: true, runValidators: true }
  );
  if (!resume) {
    throw new AppError('Resume not found', 404, 'RESUME_NOT_FOUND');
  }
  return sendSuccess(res, { resume: presentResume(resume) });
});

export const remove = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.validated.params.id, user: req.user._id }).select('+storageName');
  if (!resume) {
    throw new AppError('Resume not found', 404, 'RESUME_NOT_FOUND');
  }
  await Promise.all([
    Analysis.deleteMany({ user: req.user._id, resume: resume._id }),
    Match.deleteMany({ user: req.user._id, resume: resume._id })
  ]);
  await Resume.deleteOne({ _id: resume._id, user: req.user._id });
  await removeStoredFile(resume.storageName);
  return sendSuccess(res, { deleted: true });
});
