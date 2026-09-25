import crypto from 'node:crypto';
import Job from '../models/Job.js';
import Match from '../models/Match.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { presentJob } from '../utils/presenters.js';
import { getAiConfig } from '../config/env.js';
import { analyzeJobDescription } from '../services/aiService.js';

function descriptionHash(description) {
  return crypto.createHash('sha256').update(description).digest('hex');
}

async function matchCountsByJob(userId, jobIds) {
  const ids = [...new Set(jobIds.filter(Boolean).map((id) => String(id)))];
  if (!ids.length) {
    return new Map();
  }
  const rows = await Match.aggregate([
    { $match: { user: userId, job: { $in: ids } } },
    { $group: { _id: '$job', count: { $sum: 1 } } }
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

export const create = asyncHandler(async (req, res) => {
  const input = req.validated.body;
  const job = await Job.create({
    ...input,
    user: req.user._id,
    descriptionHash: descriptionHash(input.description),
    source: 'manual'
  });
  return sendSuccess(res, { job: presentJob(job) }, 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.validated.query;
  const filter = { user: req.user._id };
  if (req.validated.query.filters.search) {
    filter.$or = [
      { title: req.validated.query.filters.search },
      { company: req.validated.query.filters.search }
    ];
  }
  const [items, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter)
  ]);
  const counts = await matchCountsByJob(req.user._id, items.map((item) => item._id));
  return sendSuccess(res, {
    items: items.map((item) => presentJob(item, { matchCount: counts.get(String(item._id)) || 0 })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const get = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }
  const counts = await matchCountsByJob(req.user._id, [job._id]);
  return sendSuccess(res, { job: presentJob(job, { matchCount: counts.get(String(job._id)) || 0 }) });
});

export const update = asyncHandler(async (req, res) => {
  const input = req.validated.body;
  const job = await Job.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }
  const previousDescription = job.description;
  Object.assign(job, input);
  if (input.description !== undefined && input.description !== previousDescription) {
    job.descriptionHash = descriptionHash(input.description);
    job.jobAnalysis = undefined;
  }
  await job.save();
  const counts = await matchCountsByJob(req.user._id, [job._id]);
  return sendSuccess(res, { job: presentJob(job, { matchCount: counts.get(String(job._id)) || 0 }) });
});

export const remove = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.validated.params.id, user: req.user._id });
  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }
  await Match.deleteMany({ user: req.user._id, job: job._id });
  return sendSuccess(res, { deleted: true });
});

export const analyze = asyncHandler(async (req, res) => {
  const force = req.validated.query.force;
  const job = await Job.findOne({ _id: req.validated.params.id, user: req.user._id }).select('+descriptionHash');
  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }
  const currentHash = descriptionHash(job.description);
  if (!force && job.jobAnalysis?.analyzedAt && job.descriptionHash === currentHash) {
    const cachedCounts = await matchCountsByJob(req.user._id, [job._id]);
    return sendSuccess(res, { job: presentJob(job, { matchCount: cachedCounts.get(String(job._id)) || 0 }), cached: true });
  }
  const analysis = await analyzeJobDescription(job.description);
  job.jobAnalysis = {
    ...analysis,
    model: getAiConfig().model,
    analyzedAt: new Date()
  };
  job.descriptionHash = currentHash;
  await job.save();
  const counts = await matchCountsByJob(req.user._id, [job._id]);
  return sendSuccess(res, { job: presentJob(job, { matchCount: counts.get(String(job._id)) || 0 }), cached: false });
});
