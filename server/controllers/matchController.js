import crypto from 'node:crypto';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Analysis from '../models/Analysis.js';
import Match from '../models/Match.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getAiConfig } from '../config/env.js';
import { analyzeJobDescription } from '../services/aiService.js';
import { presentMatch } from '../utils/presenters.js';
import { assertMatchingOwnership, generateMatchAnalysis } from '../services/matchingService.js';

function hashDescription(description) {
  return crypto.createHash('sha256').update(description).digest('hex');
}

const population = [
  { path: 'resume', select: 'name originalName createdAt' },
  { path: 'job', select: 'title company location url employmentType createdAt' },
  { path: 'analysis', select: 'name createdAt scores.overall' }
];

export const create = asyncHandler(async (req, res) => {
  const { jobId, resumeId } = req.validated.params;
  const { analysisId, force } = req.validated.body;
  const [resume, job, analysis] = await Promise.all([
    Resume.findOne({ _id: resumeId, user: req.user._id }).select('+extractedText'),
    Job.findOne({ _id: jobId, user: req.user._id }).select('+descriptionHash'),
    analysisId
      ? Analysis.findOne({ _id: analysisId, user: req.user._id, resume: resumeId })
      : Analysis.findOne({ resume: resumeId, user: req.user._id }).sort({ createdAt: -1 })
  ]);
  assertMatchingOwnership({ userId: req.user._id, resume, job, analysis });
  const currentHash = hashDescription(job.description);
  if (!force) {
    const cached = await Match.findOne({
      user: req.user._id,
      resume: resumeId,
      job: jobId,
      analysis: analysisId || analysis._id,
      jobDescriptionHash: currentHash
    }).populate(population);
    if (cached) {
      return sendSuccess(res, { match: presentMatch(cached), cached: true });
    }
  }
  if (!job.jobAnalysis?.analyzedAt || job.descriptionHash !== currentHash) {
    const jobAnalysis = await analyzeJobDescription(job.description);
    job.jobAnalysis = {
      ...jobAnalysis,
      model: getAiConfig().model,
      analyzedAt: new Date()
    };
    job.descriptionHash = currentHash;
    await job.save();
  }
  const result = await generateMatchAnalysis({ resume, analysis, job });
  const created = await Match.create({
    user: req.user._id,
    resume: resume._id,
    job: job._id,
    analysis: analysis._id,
    jobDescriptionHash: currentHash,
    scores: result.scores,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    additionalSkills: result.additionalSkills,
    gaps: result.gaps,
    explanation: result.explanation,
    recommendation: result.recommendation,
    model: result.model,
    promptVersion: result.promptVersion
  });
  const match = await Match.findOne({ _id: created._id, user: req.user._id }).populate(population);
  return sendSuccess(res, { match: presentMatch(match), cached: false }, 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip, filters } = req.validated.query;
  const query = { user: req.user._id };
  if (filters.resumeId) query.resume = filters.resumeId;
  if (filters.jobId) query.job = filters.jobId;
  const [items, total] = await Promise.all([
    Match.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(population),
    Match.countDocuments(query)
  ]);
  return sendSuccess(res, {
    items: items.map((item) => presentMatch(item)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const get = asyncHandler(async (req, res) => {
  const match = await Match.findOne({ _id: req.validated.params.id, user: req.user._id }).populate(population);
  if (!match) {
    throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
  }
  return sendSuccess(res, { match: presentMatch(match) });
});

export const remove = asyncHandler(async (req, res) => {
  const match = await Match.findOneAndDelete({ _id: req.validated.params.id, user: req.user._id });
  if (!match) {
    throw new AppError('Match not found', 404, 'MATCH_NOT_FOUND');
  }
  return sendSuccess(res, { deleted: true });
});
