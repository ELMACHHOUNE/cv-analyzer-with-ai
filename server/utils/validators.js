import { AppError } from './AppError.js';

const objectIdPattern = /^[a-f\d]{24}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const languageCodes = new Set(['en', 'ar', 'fr']);
const themes = new Set(['system', 'light', 'dark']);
const employmentTypes = new Set(['full-time', 'part-time', 'contract', 'internship', 'temporary']);

function fail(details) {
  throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertObject(value, field) {
  if (!isPlainObject(value)) {
    fail({ [field]: 'Must be an object' });
  }
}

function assertKeys(value, allowed, field = 'body') {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    fail({ [field]: `Unknown fields: ${unknown.join(', ')}. Allowed fields: ${allowed.join(', ')}` });
  }
}

function requiredString(value, field, { min = 1, max = 5000, singleLine = false } = {}) {
  if (typeof value !== 'string') {
    fail({ [field]: 'Must be a string' });
  }
  const normalized = singleLine ? value.trim().replace(/\s+/g, ' ') : value.trim();
  if (normalized.length < min || normalized.length > max) {
    fail({ [field]: `Must contain between ${min} and ${max} characters` });
  }
  return normalized;
}

function optionalString(value, field, options = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return '';
  }
  return requiredString(value, field, options);
}

function stringList(value, field, { maxItems = 50, maxLength = 100 } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length > maxItems) {
    fail({ [field]: `Must be an array with at most ${maxItems} items` });
  }
  const result = value.map((item, index) => requiredString(item, `${field}[${index}]`, {
    min: 1,
    max: maxLength,
    singleLine: true
  }));
  return [...new Set(result)];
}

function normalizeEmail(value) {
  const email = requiredString(value, 'email', { min: 3, max: 254, singleLine: true }).toLowerCase();
  if (!emailPattern.test(email)) {
    fail({ email: 'Must be a valid email address' });
  }
  return email;
}

function normalizePassword(value, field = 'password') {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    fail({ [field]: 'Must contain between 8 and 128 characters' });
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    fail({ [field]: 'Must contain at least one letter and one number' });
  }
  if (Buffer.byteLength(value, 'utf8') > 72) {
    fail({ [field]: 'Must not exceed 72 UTF-8 bytes' });
  }
  return value;
}

function objectId(value, field) {
  if (typeof value !== 'string' || !objectIdPattern.test(value)) {
    fail({ [field]: 'Must be a valid identifier' });
  }
  return value;
}

function searchPattern(value) {
  const term = requiredString(value, 'search', { min: 1, max: 100, singleLine: true });
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: new RegExp(escaped, 'i') };
}

function queryBoolean(value, field, fallback) {
  if (value === undefined) {
    return fallback;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  fail({ [field]: 'Must be true or false' });
}

export function validateRegister(body) {
  assertObject(body, 'body');
  assertKeys(body, ['name', 'email', 'password']);
  return {
    name: requiredString(body.name, 'name', { min: 2, max: 80, singleLine: true }),
    email: normalizeEmail(body.email),
    password: normalizePassword(body.password)
  };
}

export function validateLogin(body) {
  assertObject(body, 'body');
  assertKeys(body, ['email', 'password']);
  if (typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email || !body.password) {
    fail({ credentials: 'Email and password are required' });
  }
  if (body.email.length > 254 || body.password.length > 128) {
    fail({ credentials: 'Email and password are required' });
  }
  return {
    email: body.email.trim().toLowerCase(),
    password: body.password
  };
}

export function validateSettings(body) {
  assertObject(body, 'body');
  const allowed = ['name', 'email', 'targetRole', 'preferredLanguage', 'theme'];
  assertKeys(body, allowed);
  if (!Object.keys(body).length) {
    fail({ body: 'At least one setting is required' });
  }
  const settings = {};
  if (body.name !== undefined) {
    settings.name = requiredString(body.name, 'name', { min: 2, max: 80, singleLine: true });
  }
  if (body.email !== undefined) {
    settings.email = normalizeEmail(body.email);
  }
  if (body.targetRole !== undefined) {
    settings.targetRole = optionalString(body.targetRole, 'targetRole', { max: 120, singleLine: true });
  }
  if (body.preferredLanguage !== undefined) {
    if (!languageCodes.has(body.preferredLanguage)) {
      fail({ preferredLanguage: 'Must be one of: en, ar, fr' });
    }
    settings.preferredLanguage = body.preferredLanguage;
  }
  if (body.theme !== undefined) {
    if (!themes.has(body.theme)) {
      fail({ theme: 'Must be one of: system, light, dark' });
    }
    settings.theme = body.theme;
  }
  return settings;
}

export function validatePasswordChange(body) {
  assertObject(body, 'body');
  assertKeys(body, ['currentPassword', 'newPassword']);
  return {
    currentPassword: requiredString(body.currentPassword, 'currentPassword', { min: 1, max: 128 }),
    newPassword: normalizePassword(body.newPassword, 'newPassword')
  };
}

export function validateResumeName(body = {}, required = false) {
  assertObject(body, 'body');
  assertKeys(body, ['name']);
  if (body.name === undefined) {
    if (required) {
      fail({ name: 'Must be a string' });
    }
    return {};
  }
  return { name: requiredString(body.name, 'name', { min: 2, max: 100, singleLine: true }) };
}

export function validateJob(body, partial = false) {
  assertObject(body, 'body');
  const allowed = ['title', 'company', 'location', 'employmentType', 'description', 'url', 'skills', 'notes'];
  assertKeys(body, allowed);
  if (partial && !Object.keys(body).length) {
    fail({ body: 'At least one field is required' });
  }
  const job = {};
  if (body.title !== undefined || !partial) {
    job.title = requiredString(body.title, 'title', { min: 2, max: 120, singleLine: true });
  }
  if (body.description !== undefined || !partial) {
    job.description = requiredString(body.description, 'description', { min: 80, max: 30000 });
  }
  for (const [field, max] of [['company', 120], ['location', 160], ['notes', 2000]]) {
    if (body[field] !== undefined) {
      job[field] = optionalString(body[field], field, { max, singleLine: field !== 'notes' });
    }
  }
  if (body.employmentType !== undefined) {
    if (body.employmentType !== '' && !employmentTypes.has(body.employmentType)) {
      fail({ employmentType: 'Unsupported employment type' });
    }
    job.employmentType = body.employmentType || undefined;
  }
  if (body.url !== undefined) {
    if (body.url === '' || body.url === null) {
      job.url = undefined;
    } else {
      const rawUrl = requiredString(body.url, 'url', { max: 2048, singleLine: true });
      let parsed;
      try {
        parsed = new URL(rawUrl);
      } catch {
        fail({ url: 'Must be a valid URL' });
      }
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
        fail({ url: 'Must be a public HTTP or HTTPS URL without credentials' });
      }
      job.url = parsed.toString();
    }
  }
  const skills = stringList(body.skills, 'skills');
  if (skills !== undefined) {
    job.skills = skills;
  }
  return job;
}

export function validateAnalysisCreate(body, resumeIdFromPath = false) {
  assertObject(body, 'body');
  assertKeys(body, resumeIdFromPath ? ['name'] : ['resumeId', 'name']);
  const analysis = {
    resumeId: resumeIdFromPath ? null : objectId(body.resumeId, 'resumeId')
  };
  if (body.name !== undefined) {
    analysis.name = requiredString(body.name, 'name', { min: 2, max: 100, singleLine: true });
  }
  return analysis;
}

export function validateComparison(body) {
  assertObject(body, 'body');
  assertKeys(body, ['analysisIds']);
  if (!Array.isArray(body.analysisIds) || body.analysisIds.length < 2 || body.analysisIds.length > 4) {
    fail({ analysisIds: 'Must contain between 2 and 4 analysis identifiers' });
  }
  const analysisIds = body.analysisIds.map((value, index) => objectId(value, `analysisIds[${index}]`));
  if (new Set(analysisIds).size !== analysisIds.length) {
    fail({ analysisIds: 'Identifiers must be unique' });
  }
  return { analysisIds };
}

export function validateImprovement(body = {}) {
  assertObject(body, 'body');
  assertKeys(body, ['instructions']);
  return {
    instructions: optionalString(body.instructions, 'instructions', { max: 500 }) || ''
  };
}

export function validateMatchOptions(body = {}, query = {}) {
  assertObject(body, 'body');
  assertKeys(body, ['analysisId', 'force']);
  if (query.analysisId !== undefined) {
    objectId(query.analysisId, 'analysisId');
  }
  return {
    analysisId: body.analysisId !== undefined ? objectId(body.analysisId, 'analysisId') : query.analysisId,
    force: queryBoolean(body.force ?? query.force, 'force', false)
  };
}

export function validateForceQuery(query = {}) {
  assertObject(query, 'query');
  return { force: queryBoolean(query.force, 'force', false) };
}

export function validateLatestQuery(query = {}) {
  assertObject(query, 'query');
  return {
    resumeId: query.resumeId === undefined ? undefined : objectId(query.resumeId, 'resumeId')
  };
}

export function validateListQuery(query = {}, allowedFilters = []) {
  assertObject(query, 'query');
  const pageRaw = query.page ?? '1';
  const limitRaw = query.limit ?? '20';
  if (!/^\d{1,4}$/.test(String(pageRaw)) || !/^\d{1,3}$/.test(String(limitRaw))) {
    fail({ pagination: 'Page and limit must be positive integers' });
  }
  const page = Number(pageRaw);
  const limit = Number(limitRaw);
  if (page < 1 || limit < 1 || limit > 100) {
    fail({ pagination: 'Page must be at least 1 and limit must be between 1 and 100' });
  }
  const filters = {};
  for (const filter of allowedFilters) {
    if (query[filter] === undefined) {
      continue;
    }
    if (filter === 'search') {
      filters.search = searchPattern(query[filter]);
      continue;
    }
    filters[filter] = objectId(query[filter], filter);
  }
  return { page, limit, skip: (page - 1) * limit, filters };
}

export function validateIdParam(value, field = 'id') {
  return objectId(value, field);
}

export function isSafeWebUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
