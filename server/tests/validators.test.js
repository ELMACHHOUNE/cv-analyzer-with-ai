import { describe, expect, it } from 'vitest';
import {
  validateAnalysisCreate,
  validateListQuery,
  validateMatchOptions,
  validateSettings
} from '../utils/validators.js';

describe('settings validation', () => {
  it('accepts name and email alongside the preference fields', () => {
    expect(validateSettings({
      name: '  Ada Lovelace ',
      email: ' ADA@EXAMPLE.COM ',
      targetRole: 'Backend Engineer',
      preferredLanguage: 'en',
      theme: 'dark'
    })).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      targetRole: 'Backend Engineer',
      preferredLanguage: 'en',
      theme: 'dark'
    });
  });

  it('accepts a partial settings payload', () => {
    expect(validateSettings({ name: 'Ada' })).toEqual({ name: 'Ada' });
    expect(validateSettings({ email: 'ada@example.com' })).toEqual({ email: 'ada@example.com' });
  });

  it('rejects unknown keys and names the allowed keys', () => {
    try {
      validateSettings({ nickname: 'ada' });
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details.body).toContain('nickname');
      expect(error.details.body).toContain('Allowed fields: name, email, targetRole, preferredLanguage, theme');
    }
  });

  it('rejects an invalid email, a short name, an empty body and an unsupported theme', () => {
    expect(() => validateSettings({ email: 'not-an-email' })).toThrow();
    expect(() => validateSettings({ name: 'A' })).toThrow();
    expect(() => validateSettings({})).toThrow();
    expect(() => validateSettings({ theme: 'neon' })).toThrow();
    expect(() => validateSettings({ preferredLanguage: 'de' })).toThrow();
  });
});

describe('analysis creation validation', () => {
  it('requires resumeId in the body on the collection route', () => {
    expect(validateAnalysisCreate({ resumeId: '507f1f77bcf86cd799439011', name: 'Run 1' })).toEqual({
      resumeId: '507f1f77bcf86cd799439011',
      name: 'Run 1'
    });
    expect(() => validateAnalysisCreate({})).toThrow();
  });

  it('skips the resumeId key when it comes from the path', () => {
    expect(validateAnalysisCreate({ name: 'Run 1' }, true)).toEqual({ resumeId: null, name: 'Run 1' });
    expect(validateAnalysisCreate({}, true)).toEqual({ resumeId: null });
    expect(() => validateAnalysisCreate({ resumeId: '507f1f77bcf86cd799439011' }, true)).toThrow();
  });
});

describe('match option validation', () => {
  it('rejects unknown body keys and lists the allowed keys', () => {
    try {
      validateMatchOptions({ analysisId: '507f1f77bcf86cd799439011', jobUrl: 'https://example.com' });
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details.body).toContain('jobUrl');
      expect(error.details.body).toContain('Allowed fields: analysisId, force');
    }
  });

  it('still accepts the documented keys', () => {
    expect(validateMatchOptions({ analysisId: '507f1f77bcf86cd799439011', force: true })).toEqual({
      analysisId: '507f1f77bcf86cd799439011',
      force: true
    });
    expect(validateMatchOptions({}, { analysisId: '507f1f77bcf86cd799439011' })).toEqual({
      analysisId: '507f1f77bcf86cd799439011',
      force: false
    });
  });

  it('accepts the string force flag from a query string and rejects junk', () => {
    const analysisId = '507f1f77bcf86cd799439011';
    expect(validateMatchOptions({}, { analysisId, force: 'true' }).force).toBe(true);
    expect(validateMatchOptions({}, { analysisId, force: 'false' }).force).toBe(false);
    expect(() => validateMatchOptions({}, { analysisId, force: 'yes' })).toThrow();
    expect(() => validateMatchOptions({}, { analysisId, force: 1 })).toThrow();
  });
});

describe('list query validation', () => {
  it('builds an escaped case-insensitive search filter', () => {
    const result = validateListQuery({ search: 'acme (remote)' }, ['search']);
    const pattern = result.filters.search.$regex;
    expect(pattern).toBeInstanceOf(RegExp);
    expect(pattern.flags).toBe('i');
    expect(pattern.source).toBe('acme \\(remote\\)');
    expect(pattern.test('Role at ACME (Remote)')).toBe(true);
    expect(pattern.test('acme remote')).toBe(false);
  });

  it('rejects an overlong or blank search term', () => {
    expect(() => validateListQuery({ search: '   ' }, ['search'])).toThrow();
    expect(() => validateListQuery({ search: 'a'.repeat(101) }, ['search'])).toThrow();
  });

  it('keeps identifier filters and pagination behaviour', () => {
    const result = validateListQuery({ page: '2', limit: '5', resumeId: '507f1f77bcf86cd799439011' }, ['resumeId']);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.skip).toBe(5);
    expect(result.filters.resumeId).toBe('507f1f77bcf86cd799439011');
    expect(result.filters.search).toBeUndefined();
  });
});
