export const RESUME_SCORE_WEIGHTS = Object.freeze({
  contactInformation: 10,
  professionalSummary: 10,
  skills: 20,
  experience: 25,
  education: 10,
  projects: 5,
  quantifiedImpact: 10,
  clarity: 10
});

export const MATCH_SCORE_WEIGHTS = Object.freeze({
  skills: 40,
  experience: 25,
  education: 10,
  keywords: 10,
  impact: 10,
  completeness: 5
});

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function words(value) {
  return String(value || '').match(/[\p{L}\p{N}]+/gu) || [];
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

function arrayValue(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

export function scoreCategoryMap(scores) {
  const categories = scores?.categories;
  if (categories instanceof Map) {
    return Object.fromEntries(categories);
  }
  return categories && typeof categories === 'object' ? categories : {};
}

export function scoreCategoryEntries(scores) {
  return Object.entries(scoreCategoryMap(scores)).map(([key, value]) => ({
    key,
    label: value?.label ?? null,
    score: clamp(value?.score),
    weight: clamp(value?.weight),
    weightedPoints: round(Number(value?.weightedPoints) || 0, 1),
    explanation: value?.explanation ?? '',
    evidence: uniqueStrings(value?.evidence).slice(0, 6)
  }));
}

export function getScoreLabel(score) {
  const normalized = clamp(score);
  if (normalized >= 85) {
    return 'Strong foundation';
  }
  if (normalized >= 70) {
    return 'Solid foundation';
  }
  if (normalized >= 50) {
    return 'Developing foundation';
  }
  return 'Early-stage foundation';
}

export function categoryLabel(score) {
  if (score >= 80) {
    return 'Established';
  }
  if (score >= 60) {
    return 'Developing';
  }
  if (score >= 30) {
    return 'Limited evidence';
  }
  return 'Not evidenced';
}

function category(score, weight, explanation, evidence = []) {
  const normalizedScore = round(clamp(score));
  return {
    score: normalizedScore,
    weight,
    weightedPoints: round(normalizedScore * weight / 100, 1),
    label: categoryLabel(normalizedScore),
    explanation,
    evidence: uniqueStrings(evidence).slice(0, 4)
  };
}

function sourceEvidence(text, values) {
  const normalizedText = String(text || '').toLowerCase().replace(/\s+/g, ' ');
  return uniqueStrings(values).filter((value) => normalizedText.includes(String(value).toLowerCase().replace(/\s+/g, ' ')));
}

function firstLine(value) {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
}

function entryEvidence(text, entries, fields) {
  return sourceEvidence(text, entries.flatMap((entry) => fields.map((field) => (
    field === 'description' ? firstLine(entry[field]) : entry[field]
  ))));
}

function sectionText(lines, pattern) {
  const index = lines.findIndex((line) => pattern.test(line.trim()));
  if (index < 0) {
    return '';
  }
  const section = [];
  for (let cursor = index + 1; cursor < lines.length && section.length < 12; cursor += 1) {
    if (cursor > index + 1 && /^(experience|education|skills|projects|contact|certifications?|languages?|summary|profile)\b/i.test(lines[cursor].trim())) {
      break;
    }
    section.push(lines[cursor].trim());
  }
  return section.filter(Boolean).join('\n');
}

function hasSection(text, pattern) {
  return pattern.test(String(text || ''));
}

function findPhone(text) {
  const source = String(text || '');
  for (const candidate of source.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      continue;
    }
    if (/^\d{4}\s*[-–—]\s*\d{2,4}$/.test(candidate.trim())) {
      continue;
    }
    return candidate;
  }
  return '';
}

function contactScore(text, information) {
  const info = information || {};
  const name = sourceEvidence(text, [info.name])[0] || '';
  const foundEmail = String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const foundPhone = findPhone(text);
  const location = sourceEvidence(text, [info.location])[0] || '';
  const links = sourceEvidence(text, uniqueStrings(info.links || info.urls));
  const components = [
    Boolean(name) || hasSection(text, /^(name|contact)\b/i),
    Boolean(foundEmail),
    Boolean(foundPhone),
    Boolean(location),
    links.length > 0 || /\b(?:https?:\/\/|linkedin\.com|github\.com)\b/i.test(text)
  ];
  const score = components.filter(Boolean).length * 20;
  const evidence = sourceEvidence(text, [name, foundEmail, foundPhone, location, ...links]);
  return category(score, RESUME_SCORE_WEIGHTS.contactInformation,
    `${components.filter(Boolean).length} of 5 contact elements are present.`, evidence);
}

function summaryScore(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstParagraph = String(text || '').split(/\n\s*\n/).map((part) => part.trim()).find(Boolean) || '';
  const marked = sectionText(lines, /^(professional\s+)?(summary|profile|objective|about me)\b/i);
  const candidate = marked || firstParagraph;
  const count = words(candidate).length;
  let score = 0;
  if (count >= 30 && count <= 220) {
    score = marked ? 100 : 82;
  } else if (count >= 15 && count < 300) {
    score = 55;
  } else if (count > 0) {
    score = 25;
  }
  return category(score, RESUME_SCORE_WEIGHTS.professionalSummary,
    marked
      ? `A marked summary section contains ${count} words.`
      : `A clearly identifiable summary area contains ${count} words.`,
    candidate ? [candidate.slice(0, 180)] : []);
}

function skillsScore(text, information) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim());
  const section = sectionText(lines, /^(technical\s+|core\s+|key\s+)?skills\b/i);
  const listed = uniqueStrings(information?.skills);
  const lineItems = section.split(/\n|,|•/).map((item) => item.trim()).filter((item) => item.length <= 80);
  const count = Math.max(listed.length, new Set(lineItems).size);
  const score = Math.min(100, count * 10) + (section && count ? 0 : section ? 10 : 0);
  return category(score, RESUME_SCORE_WEIGHTS.skills,
    `${count} distinct skill entries were identified.`, sourceEvidence(text, listed));
}

function experienceScore(text, information) {
  const entries = arrayValue(information?.experience);
  const countScore = Math.min(100, entries.length * 35);
  const detailed = entries.filter((entry) => words(`${entry.role || ''} ${entry.company || ''} ${entry.description || ''}`).length >= 8).length;
  const dated = entries.filter((entry) => /\b(?:19|20)\d{2}\b/.test(`${entry.startDate || ''} ${entry.endDate || ''} ${entry.duration || ''}`)).length;
  const score = Math.min(40, countScore * 0.4) + Math.min(30, detailed * 15) + Math.min(30, dated * 15);
  return category(score, RESUME_SCORE_WEIGHTS.experience,
    `${entries.length} experience entries include ${detailed} detailed entries and ${dated} with date evidence.`,
    entryEvidence(text, entries, ['role', 'company', 'description']));
}

function educationScore(text, information) {
  const entries = arrayValue(information?.education);
  if (!entries.length) {
    return category(0, RESUME_SCORE_WEIGHTS.education, 'No education entries were identified.');
  }
  const detailed = entries.filter((entry) => entry.degree || entry.field || entry.institution).length;
  const dated = entries.filter((entry) => /\b(?:19|20)\d{2}\b/.test(`${entry.startDate || ''} ${entry.endDate || ''} ${entry.year || ''}`)).length;
  const score = Math.min(50, entries.length * 25) + Math.min(25, detailed * 12.5) + Math.min(25, dated * 12.5);
  return category(score, RESUME_SCORE_WEIGHTS.education,
    `${entries.length} education entries include ${detailed} with degree or field detail and ${dated} with date evidence.`,
    entryEvidence(text, entries, ['degree', 'field', 'institution', 'description']));
}

function projectsScore(text, information) {
  const entries = arrayValue(information?.projects);
  const marked = hasSection(text, /^(projects?|portfolio|selected work)\b/im);
  const detailed = entries.filter((entry) => words(`${entry.name || ''} ${entry.description || ''} ${entry.role || ''}`).length >= 8).length;
  const score = Math.min(60, entries.length * 30) + Math.min(20, detailed * 10) + (marked ? 20 : 0);
  return category(score, RESUME_SCORE_WEIGHTS.projects,
    `${entries.length} project entries were identified${marked ? ' and a project section is present' : ''}.`,
    entryEvidence(text, entries, ['name', 'role', 'description']));
}

function impactScore(text, information) {
  const achievements = arrayValue(information?.achievements);
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const quantified = lines.filter((line) => /\b\d+(?:[.,]\d+)?\s*(?:%|x|k|m|bn|million|thousand)?\b/i.test(line));
  const actionLines = lines.filter((line) => /\b(?:led|built|created|improved|increased|reduced|delivered|designed|implemented|managed|developed|launched|resolved|achieved)\b/i.test(line));
  const distinct = new Set([...quantified, ...actionLines].map((line) => line.toLowerCase()));
  const score = Math.min(100, distinct.size * 12 + achievements.length * 5);
  return category(score, RESUME_SCORE_WEIGHTS.quantifiedImpact,
    `${distinct.size} achievement-oriented statements and ${achievements.length} structured achievements were identified.`,
    distinct);
}

function clarityScore(text) {
  const content = String(text || '').trim();
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const wordCount = words(content).length;
  const averageLineLength = lines.length ? content.length / lines.length : content.length;
  const sections = lines.filter((line) => /^(?:[A-Z][A-Z\s/&-]{2,40}|summary|profile|experience|education|skills|projects?)$/i.test(line)).length;
  let score = 0;
  if (wordCount >= 120) score += 30;
  if (wordCount >= 250 && wordCount <= 1800) score += 20;
  if (lines.length >= 8) score += 15;
  if (averageLineLength >= 20 && averageLineLength <= 180) score += 20;
  if (sections >= 3) score += 15;
  if (!/\n{3,}/.test(content)) score += 5;
  return category(score, RESUME_SCORE_WEIGHTS.clarity,
    `${wordCount} words across ${lines.length} non-empty lines with ${sections} section markers.`,
    lines.filter((line) => /^(summary|profile|experience|education|skills|projects?)$/i.test(line)));
}

export const RESUME_SCORE_DISCLAIMER = 'This educational score is an estimate and does not guarantee employment.';

export function calculateResumeScore({ text, information } = {}) {
  const categories = {
    contactInformation: contactScore(text, information),
    professionalSummary: summaryScore(text),
    skills: skillsScore(text, information),
    experience: experienceScore(text, information),
    education: educationScore(text, information),
    projects: projectsScore(text, information),
    quantifiedImpact: impactScore(text, information),
    clarity: clarityScore(text)
  };
  const overall = round(Object.values(categories).reduce((total, item) => total + item.score * item.weight, 0) / 100);
  return {
    overall: {
      score: overall,
      label: getScoreLabel(overall),
      formula: 'Deterministic weighted sum of category evidence'
    },
    categories,
    generatedBy: 'deterministic-v1',
    disclaimer: RESUME_SCORE_DISCLAIMER
  };
}

export function calculateMatchOverall(categoryScores = {}) {
  const categories = {};
  let weightedTotal = 0;
  for (const [name, weight] of Object.entries(MATCH_SCORE_WEIGHTS)) {
    const raw = categoryScores[name];
    const score = round(clamp(typeof raw === 'object' ? raw?.score : raw));
    categories[name] = { score, weight, weightedPoints: round(score * weight / 100, 1) };
    weightedTotal += score * weight;
  }
  const overall = round(weightedTotal / 100);
  return {
    overall,
    label: getScoreLabel(overall),
    categories,
    formula: '40% skills + 25% experience + 10% education + 10% keywords + 10% impact + 5% completeness',
    disclaimer: 'This educational match estimate does not guarantee an interview or employment.'
  };
}

const missingInformationRules = Object.freeze([
  { category: 'contactInformation', test: (c) => !hasEvidence(c), message: 'Add a complete contact block with an email address and phone number.' },
  { category: 'professionalSummary', test: (c) => !hasEvidence(c) || c.score < 40, message: 'Add a short professional summary describing your focus and strengths.' },
  { category: 'skills', test: (c) => !hasEvidence(c), message: 'Add a dedicated skills section listing your technical and soft skills.' },
  { category: 'experience', test: (c) => !hasEvidence(c), message: 'Add work experience entries with role, company, dates, and measurable outcomes.' },
  { category: 'education', test: (c) => !hasEvidence(c), message: 'Add your degree, field of study, institution, and graduation year.' },
  { category: 'projects', test: (c) => !hasEvidence(c), message: 'Add at least one project with your role, what you built, and the outcome.' },
  { category: 'quantifiedImpact', test: (c) => c.score < 40, message: 'Quantify your impact with numbers, percentages, scale, or time saved.' },
  { category: 'clarity', test: (c) => c.score < 50, message: 'Improve formatting and readability with clear section headings and concise lines.' }
]);

function hasEvidence(category) {
  return Array.isArray(category.evidence) && category.evidence.length > 0;
}

export function buildMissingInformation(scores) {
  const categories = scoreCategoryMap(scores);
  const missing = [];
  for (const rule of missingInformationRules) {
    const category = categories[rule.category];
    if (category && rule.test(category)) {
      missing.push(rule.message);
    }
  }
  return missing;
}
