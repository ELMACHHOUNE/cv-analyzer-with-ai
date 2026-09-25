import { describe, expect, it } from 'vitest';
import { assertMatchingOwnership } from '../services/matchingService.js';

const userId = '507f1f77bcf86cd799439011';
const otherUserId = '507f191e810c19729de860ea';
const resumeId = '507f1f77bcf86cd799439012';
const jobId = '507f1f77bcf86cd799439013';
const analysisId = '507f1f77bcf86cd799439014';

function resources() {
  return {
    userId,
    resume: { _id: resumeId, user: userId },
    job: { _id: jobId, user: userId },
    analysis: { _id: analysisId, user: userId, resume: resumeId }
  };
}

describe('matching ownership utility', () => {
  it('accepts resources linked to the same user and resume', () => {
    expect(assertMatchingOwnership(resources())).toBe(true);
  });

  it('rejects resources owned by another user', () => {
    const value = resources();
    value.job.user = otherUserId;
    expect(() => assertMatchingOwnership(value)).toThrow(expect.objectContaining({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND'
    }));
  });

  it('rejects an analysis attached to a different resume', () => {
    const value = resources();
    value.analysis.resume = jobId;
    expect(() => assertMatchingOwnership(value)).toThrow(expect.objectContaining({
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND'
    }));
  });
});
