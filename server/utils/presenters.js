import {
  buildMissingInformation,
  categoryLabel,
  scoreCategoryEntries,
  scoreCategoryMap
} from './scoreCalculator.js';

const confidentialResumeFields = ['storageName', 'extractedText', 'textHash'];
const confidentialUserFields = ['passwordHash'];

const MATCH_PRESENTED_CATEGORIES = Object.freeze([
  'skills',
  'experience',
  'education',
  'keywords',
  'impact',
  'completeness'
]);

function toPlain(value) {
  if (!value) return {};
  return typeof value.toJSON === 'function' ? value.toJSON() : { ...value };
}

function omit(source, keys) {
  const result = { ...source };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

function text(value) {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result || null;
}

function stringArray(value) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function objectArray(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function scoreValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitHighlights(description) {
  return String(description || '')
    .split(/\r?\n+|(?<=\S)\s*[•·▪-]\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function presentExperienceEntry(entry) {
  const role = text(entry.role) || text(entry.title) || null;
  return {
    role,
    title: text(entry.title) || role,
    company: text(entry.company) || null,
    location: text(entry.location) || null,
    startDate: text(entry.startDate) || null,
    endDate: text(entry.endDate) || null,
    duration: text(entry.duration) || null,
    description: text(entry.description) || null,
    highlights: entry.highlights ? stringArray(entry.highlights) : splitHighlights(entry.description)
  };
}

function presentEducationEntry(entry) {
  return {
    degree: text(entry.degree) || null,
    field: text(entry.field) || null,
    institution: text(entry.institution) || null,
    startDate: text(entry.startDate) || null,
    endDate: text(entry.endDate) || null,
    year: text(entry.year) || null,
    description: text(entry.description) || null
  };
}

function presentProjectEntry(entry) {
  const name = text(entry.name) || null;
  return {
    name,
    title: text(entry.title) || name,
    role: text(entry.role) || null,
    description: text(entry.description) || null,
    technologies: stringArray(entry.technologies),
    skills: stringArray(entry.skills),
    url: text(entry.url) || null,
    startDate: text(entry.startDate) || null,
    endDate: text(entry.endDate) || null
  };
}

function presentProfile(information, summary) {
  const name = text(information.name) || null;
  return {
    fullName: name,
    name,
    email: text(information.email) || null,
    phone: text(information.phone) || null,
    location: text(information.location) || null,
    summary: text(summary) || null,
    links: stringArray(information.links)
  };
}

export function presentAnalysis(analysis, { resumeName } = {}) {
  if (!analysis) return null;
  const value = toPlain(analysis);
  const scores = value.scores || {};
  const information = value.information && typeof value.information === 'object' ? value.information : {};
  const categories = scoreCategoryEntries(scores);
  const skills = stringArray(information.skills);
  const technicalSkills = stringArray(information.technicalSkills).length
    ? stringArray(information.technicalSkills)
    : skills;
  const softSkills = stringArray(information.softSkills);
  const strengths = objectArray(value.strengths);
  const improvements = objectArray(value.improvements);
  const resolvedResumeName = text(resumeName)
    || (value.resume && typeof value.resume === 'object' ? text(value.resume.name) : null);
  return {
    ...value,
    scores: { ...scores, categories: scoreCategoryMap(scores) },
    score: scoreValue(scores.overall?.score),
    label: text(scores.overall?.label) || null,
    scoreFormula: text(scores.overall?.formula) || null,
    scoreDisclaimer: text(scores.disclaimer) || null,
    scoreBreakdown: categories,
    categories,
    profile: presentProfile(information, value.summary),
    summary: text(value.summary) || '',
    skills,
    technicalSkills,
    softSkills,
    technologies: technicalSkills,
    experience: objectArray(information.experience).map(presentExperienceEntry),
    education: objectArray(information.education).map(presentEducationEntry),
    projects: objectArray(information.projects).map(presentProjectEntry),
    certifications: stringArray(information.certifications),
    languages: stringArray(information.languages),
    achievements: stringArray(information.achievements),
    strengths,
    improvements,
    weaknesses: improvements,
    missingInformation: buildMissingInformation(scores),
    recommendations: stringArray(value.recommendations),
    explanation: {
      strongPoints: strengths.map((item) => text(item.explanation) || text(item.title)).filter(Boolean),
      areasToImprove: improvements.map((item) => text(item.explanation) || text(item.title)).filter(Boolean),
      formula: text(scores.overall?.formula) || null,
      disclaimer: text(scores.disclaimer) || null
    },
    resumeName: resolvedResumeName,
    disclaimer: text(value.disclaimer) || null,
    model: text(value.model) || null,
    promptVersion: text(value.promptVersion) || null,
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null
  };
}

function presentMatchCategory(matchCategories, key) {
  const category = matchCategories[key] || {};
  const score = scoreValue(category.score);
  return {
    score,
    label: text(category.label) || categoryLabel(score),
    weight: scoreValue(category.weight),
    weightedPoints: scoreValue(category.weightedPoints),
    explanation: text(category.explanation) || '',
    evidence: stringArray(category.evidence)
  };
}

function presentPopulatedResume(value) {
  if (!value) return null;
  const resume = toPlain(value);
  return {
    ...resume,
    name: text(resume.name) || null,
    originalName: text(resume.originalName) || null,
    fileName: text(resume.originalName) || null
  };
}

function presentPopulatedJob(value) {
  if (!value) return null;
  const job = toPlain(value);
  return {
    ...job,
    title: text(job.title) || null,
    company: text(job.company) || null,
    location: text(job.location) || null,
    url: text(job.url) || null
  };
}

export function presentMatch(match) {
  if (!match) return null;
  const value = toPlain(match);
  const scores = value.scores && typeof value.scores === 'object' ? value.scores : {};
  const matchCategories = scoreCategoryMap({ categories: scores.categories });
  const breakdown = MATCH_PRESENTED_CATEGORIES
    .map((key) => ({ key, ...presentMatchCategory(matchCategories, key) }));
  const categoryScores = {};
  for (const key of MATCH_PRESENTED_CATEGORIES) {
    categoryScores[key] = scoreValue(matchCategories[key]?.score);
  }
  const gaps = objectArray(value.gaps);
  const matchedSkills = stringArray(value.matchedSkills);
  const missingSkills = stringArray(value.missingSkills);
  const additionalSkills = stringArray(value.additionalSkills);
  const experienceCategory = presentMatchCategory(matchCategories, 'experience');
  const educationCategory = presentMatchCategory(matchCategories, 'education');
  const keywordCategory = presentMatchCategory(matchCategories, 'keywords');
  const skillsCategory = presentMatchCategory(matchCategories, 'skills');
  const recommendation = text(value.recommendation);
  return {
    ...value,
    scores,
    score: scoreValue(scores.overall),
    label: text(scores.label) || null,
    scoreBreakdown: breakdown,
    categoryScores,
    matchedSkills,
    matchingSkills: matchedSkills,
    missingSkills,
    additionalSkills,
    matchingExperience: experienceCategory.evidence.map((item) => ({
      item,
      explanation: experienceCategory.explanation
    })),
    missingExperience: gaps
      .filter((gap) => gap.importance === 'required')
      .map((gap) => ({
        item: text(gap.item) || null,
        importance: text(gap.importance) || 'required',
        explanation: text(gap.explanation) || ''
      })),
    educationCompatibility: {
      score: educationCategory.score,
      label: educationCategory.label,
      explanation: educationCategory.explanation,
      evidence: educationCategory.evidence
    },
    keywordMatches: keywordCategory.evidence,
    strongMatches: skillsCategory.evidence,
    gaps,
    recommendations: [
      ...(recommendation ? [recommendation] : []),
      ...gaps.map((gap) => text(gap.explanation)).filter(Boolean)
    ],
    explanation: text(value.explanation) || '',
    disclaimer: text(scores.disclaimer) || null,
    resume: presentPopulatedResume(value.resume),
    job: presentPopulatedJob(value.job),
    createdAt: value.createdAt || null
  };
}

const resumeStatusVocabulary = Object.freeze({
  ready: 'processed',
  processed: 'processed',
  uploaded: 'uploaded',
  processing: 'processing',
  failed: 'failed'
});

function presentAnalysisReference(analysis) {
  if (!analysis) return null;
  const value = toPlain(analysis);
  return {
    _id: value._id || null,
    score: scoreValue(value.scores?.overall?.score),
    label: text(value.scores?.overall?.label) || null,
    createdAt: value.createdAt || null
  };
}

export function presentResume(resume, { analysis } = {}) {
  if (!resume) return null;
  const value = omit(toPlain(resume), confidentialResumeFields);
  return {
    ...value,
    fileName: text(value.originalName) || null,
    fileType: text(value.mimeType) || null,
    fileSize: scoreValue(value.size),
    status: resumeStatusVocabulary[text(value.status)] || 'processed',
    extractionMethod: text(value.extractionMethod) || null,
    wordCount: scoreValue(value.wordCount),
    characterCount: scoreValue(value.characterCount),
    pageCount: scoreValue(value.pageCount),
    analysisCount: scoreValue(value.analysisCount),
    lastAnalyzedAt: value.lastAnalyzedAt || null,
    analysis: presentAnalysisReference(analysis),
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null
  };
}

export function presentJob(job, { matchCount = 0 } = {}) {
  if (!job) return null;
  const value = omit(toPlain(job), ['descriptionHash']);
  const jobAnalysis = value.jobAnalysis && typeof value.jobAnalysis === 'object' ? value.jobAnalysis : null;
  return {
    ...value,
    keywords: stringArray(jobAnalysis?.keywords),
    skills: jobAnalysis ? stringArray(jobAnalysis.skills) : stringArray(value.skills),
    matchCount: scoreValue(matchCount),
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null
  };
}

export function presentUser(user) {
  if (!user) return null;
  const value = omit(toPlain(user), confidentialUserFields);
  const settings = value.settings && typeof value.settings === 'object' ? value.settings : {};
  return {
    ...value,
    name: text(value.name) || null,
    email: text(value.email) || null,
    settings: {
      targetRole: text(settings.targetRole) || '',
      preferredLanguage: text(settings.preferredLanguage) || 'en',
      theme: text(settings.theme) || 'system'
    },
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null
  };
}
