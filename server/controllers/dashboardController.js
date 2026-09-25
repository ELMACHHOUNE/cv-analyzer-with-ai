import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Analysis from '../models/Analysis.js';
import Match from '../models/Match.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { presentAnalysis, presentJob, presentMatch } from '../utils/presenters.js';

function roundScore(value) {
  return value === null || value === undefined ? null : Math.round(value * 10) / 10;
}

export const get = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [
    totalResumes,
    totalJobs,
    totalAnalyses,
    totalMatches,
    scoreAggregate,
    matchAggregate,
    recentAnalyses,
    topMatches,
    recentJobs
  ] = await Promise.all([
    Resume.countDocuments({ user: userId }),
    Job.countDocuments({ user: userId }),
    Analysis.countDocuments({ user: userId }),
    Match.countDocuments({ user: userId }),
    Analysis.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, average: { $avg: '$scores.overall.score' }, highest: { $max: '$scores.overall.score' } } }
    ]),
    Match.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, average: { $avg: '$scores.overall' } } }
    ]),
    Analysis.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('resume name summary scores.overall createdAt'),
    Match.find({ user: userId })
      .sort({ 'scores.overall': -1, createdAt: -1 })
      .limit(5)
      .select('resume job analysis scores.overall scores.label scores.disclaimer scores.categories matchedSkills missingSkills additionalSkills gaps explanation recommendation createdAt')
      .populate([
        { path: 'resume', select: 'name originalName' },
        { path: 'job', select: 'title company location url' },
        { path: 'analysis', select: 'name' }
      ]),
    Job.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title company location url employmentType jobAnalysis skills createdAt updatedAt')
  ]);

  const averageScore = roundScore(scoreAggregate[0]?.average);
  const highestScore = scoreAggregate[0]?.highest ?? null;
  const averageMatch = roundScore(matchAggregate[0]?.average);
  const latestScore = recentAnalyses[0]?.scores?.overall?.score ?? null;
  const presentedMatches = topMatches.map((item) => presentMatch(item));
  const presentedAnalyses = recentAnalyses.map((item) => presentAnalysis(item));
  const presentedJobs = recentJobs.map((item) => presentJob(item));

  return sendSuccess(res, {
    stats: {
      totals: {
        resumes: totalResumes,
        jobs: totalJobs,
        analyses: totalAnalyses,
        matches: totalMatches
      },
      resumes: totalResumes,
      jobs: totalJobs,
      analyses: totalAnalyses,
      matches: totalMatches,
      averageScore,
      highestScore,
      averageMatch: totalMatches ? averageMatch : null,
      latestScore,
      scores: {
        average: averageScore,
        highest: highestScore,
        latest: latestScore
      }
    },
    recentAnalyses: presentedAnalyses,
    recentMatches: presentedMatches,
    topMatches: presentedMatches,
    recentJobs: presentedJobs
  });
});
