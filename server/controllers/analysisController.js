import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { presentAnalysis } from '../utils/presenters.js';
import { analyzeResume, generateRecommendations, improveResume } from '../services/aiService.js';
import { calculateResumeScore, RESUME_SCORE_DISCLAIMER, scoreCategoryMap } from '../utils/scoreCalculator.js';

function uniqueIds(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

async function resumeNamesById(userId, analyses) {
  const ids = uniqueIds(analyses.map((item) => item.resume));
  if (!ids.length) {
    return new Map();
  }
  const resumes = await Resume.find({ _id: { $in: ids }, user: userId }).select('name');
  return new Map(resumes.map((resume) => [String(resume._id), resume.name]));
}

export const create = asyncHandler(async (req, res) => {
  const input = req.validated.body;
  const resume = await Resume.findOne({ _id: input.resumeId, user: req.user._id }).select('+extractedText');
  if (!resume) {
    throw new AppError('Resume not found', 404, 'RESUME_NOT_FOUND');
  }
  const aiResult = await analyzeResume(resume.extractedText);
  const scores = calculateResumeScore({
    text: resume.extractedText,
    information: aiResult.information
  });
  const analysis = await Analysis.create({
    user: req.user._id,
    resume: resume._id,
    name: input.name || `${resume.name} analysis`,
    summary: aiResult.summary || 'No concise summary could be generated from the supplied document.',
    information: aiResult.information,
    scores,
    strengths: aiResult.strengths,
    improvements: aiResult.improvements,
    recommendations: aiResult.recommendations,
    model: aiResult.model,
    promptVersion: aiResult.promptVersion,
    disclaimer: RESUME_SCORE_DISCLAIMER
  });
  await Resume.updateOne(
    { _id: resume._id, user: req.user._id },
    { $inc: { analysisCount: 1 }, $set: { lastAnalyzedAt: analysis.createdAt } }
  );
  return sendSuccess(res, { analysis: presentAnalysis(analysis, { resumeName: resume.name }) }, 201);
});

export const createForResume = asyncHandler(async (req, res) => {
  req.validated = {
    ...req.validated,
    body: { ...req.validated.body, resumeId: req.validated.params.resumeId }
  };
  return create(req, res);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.validated.query;
  const filter = { user: req.user._id };
  if (req.validated.query.filters.resumeId) {
    filter.resume = req.validated.query.filters.resumeId;
  }
  if (req.validated.query.filters.search) {
    filter.name = req.validated.query.filters.search;
  }
  const [items, total] = await Promise.all([
    Analysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Analysis.countDocuments(filter)
  ]);
  const resumeNames = await resumeNamesById(req.user._id, items);
  return sendSuccess(res, {
    items: items.map((item) => presentAnalysis(item, { resumeName: resumeNames.get(String(item.resume)) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const get = asyncHandler(async (req, res) => {
  const { idOrResumeId } = req.validated.params;
  let analysis = await Analysis.findOne({ _id: idOrResumeId, user: req.user._id });
  if (!analysis) {
    const resume = await Resume.findOne({ _id: idOrResumeId, user: req.user._id }).select('name');
    if (!resume) {
      throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
    }
    analysis = await Analysis.findOne({ resume: resume._id, user: req.user._id }).sort({ createdAt: -1 });
    if (!analysis) {
      throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
    }
  }
  const resume = await Resume.findOne({ _id: analysis.resume, user: req.user._id }).select('name');
  return sendSuccess(res, { analysis: presentAnalysis(analysis, { resumeName: resume?.name }) });
});

export const latest = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.validated.query.resumeId) {
    filter.resume = req.validated.query.resumeId;
  }
  const analysis = await Analysis.findOne(filter).sort({ createdAt: -1 });
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }
  const resume = await Resume.findOne({ _id: analysis.resume, user: req.user._id }).select('name');
  return sendSuccess(res, { analysis: presentAnalysis(analysis, { resumeName: resume?.name }) });
});

export const remove = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOneAndDelete({ _id: req.validated.params.id, user: req.user._id });
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }
  if (analysis.resume) {
    const analysisCount = await Analysis.countDocuments({ user: req.user._id, resume: analysis.resume });
    await Resume.updateOne(
      { _id: analysis.resume, user: req.user._id },
      { $set: { analysisCount } }
    );
  }
  return sendSuccess(res, { deleted: true });
});

export const compare = asyncHandler(async (req, res) => {
  const { analysisIds } = req.validated.body;
  const items = await Analysis.find({ _id: { $in: analysisIds }, user: req.user._id }).sort({ createdAt: 1 });
  if (items.length !== analysisIds.length) {
    throw new AppError('One or more analyses were not found', 404, 'ANALYSIS_NOT_FOUND');
  }
  const normalized = items.map((item) => presentAnalysis(item));
  const firstCategories = scoreCategoryMap(items[0].scores);
  const categoryDeltas = Object.keys(firstCategories).map((category) => {
    const scores = normalized.map((item) => scoreCategoryMap(item.scores)[category]?.score ?? 0);
    return {
      category,
      difference: Math.max(...scores) - Math.min(...scores),
      highest: normalized[scores.indexOf(Math.max(...scores))]._id,
      lowest: normalized[scores.indexOf(Math.min(...scores))]._id
    };
  }).sort((left, right) => right.difference - left.difference);
  return sendSuccess(res, {
    analyses: normalized,
    summary: {
      highestOverall: normalized.reduce((best, item) => (item.score > best.score ? item : best)),
      lowestOverall: normalized.reduce((worst, item) => (item.score < worst.score ? item : worst)),
      categoryDeltas
    }
  });
});

export const improve = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }
  const resume = await Resume.findOne({ _id: analysis.resume, user: req.user._id }).select('+extractedText');
  if (!resume) {
    throw new AppError('Resume not found', 404, 'RESUME_NOT_FOUND');
  }
  const improvement = await improveResume(resume.extractedText, req.validated.body.instructions);
  return sendSuccess(res, { analysisId: analysis._id, improvement });
});

export const recommendations = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }
  const resume = await Resume.findOne({ _id: analysis.resume, user: req.user._id }).select('+extractedText');
  if (!resume) {
    throw new AppError('Resume not found', 404, 'RESUME_NOT_FOUND');
  }
  const result = await generateRecommendations(resume.extractedText, analysis);
  return sendSuccess(res, { analysisId: analysis._id, ...result });
});
