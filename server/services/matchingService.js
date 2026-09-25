import { getAiConfig } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { aiPromptVersion, matchResumeWithJob } from './aiService.js';

function idEquals(left, right) {
  return Boolean(left && right) && String(left) === String(right);
}

export function assertMatchingOwnership({ userId, resume, job, analysis }) {
  const owned = resume && job && analysis
    && idEquals(resume.user, userId)
    && idEquals(job.user, userId)
    && idEquals(analysis.user, userId)
    && idEquals(analysis.resume, resume._id);
  if (!owned) {
    throw new AppError('Resume, job, or analysis not found', 404, 'RESOURCE_NOT_FOUND');
  }
  return true;
}

export async function generateMatchAnalysis({ resume, analysis, job, dependencies = {} }) {
  const result = await matchResumeWithJob({
    resumeText: resume.extractedText,
    resumeInformation: analysis.information,
    resumeScores: analysis.scores,
    jobDescription: job.description,
    jobAnalysis: job.jobAnalysis
  }, dependencies);
  return {
    ...result,
    model: getAiConfig().model,
    promptVersion: aiPromptVersion
  };
}
