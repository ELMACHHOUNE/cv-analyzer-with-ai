const SCORE_FIELDS = ['score', 'overall', 'value', 'percentage', 'total', 'average', 'rating']
const MATCH_CATEGORY_KEYS = ['skills', 'experience', 'education', 'keywords', 'impact', 'completeness']
const RESUME_STATUS_MAP = {
  uploaded: 'uploaded',
  pending: 'processing',
  queued: 'processing',
  processing: 'processing',
  running: 'processing',
  analyzing: 'processing',
  analyzed: 'processed',
  analysed: 'processed',
  ready: 'processed',
  processed: 'processed',
  completed: 'processed',
  complete: 'processed',
  success: 'processed',
  done: 'processed',
  failed: 'failed',
  error: 'failed',
  invalid: 'failed',
}
export const THEME_VALUES = ['system', 'light', 'dark']

export function isPlainRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/%$/, '')
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function toScore(value) {
  if (value === null || value === undefined || value === '') return null
  const direct = toNumber(value)
  if (direct !== null) return Math.max(0, Math.min(100, direct))
  if (Array.isArray(value)) {
    const values = value.map(toScore).filter((item) => item !== null)
    if (!values.length) return null
    return Math.max(0, Math.min(100, values.reduce((sum, item) => sum + item, 0) / values.length))
  }
  if (isPlainRecord(value)) {
    for (const field of SCORE_FIELDS) {
      if (value[field] === undefined || value[field] === null) continue
      const nested = toScore(value[field])
      if (nested !== null) return nested
    }
  }
  return null
}

export function asText(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (Array.isArray(value)) return asText(value[0])
  if (!isPlainRecord(value)) return ''
  for (const field of ['text', 'title', 'name', 'label', 'keyword', 'skill', 'value', 'item', 'description']) {
    const nested = asText(value[field])
    if (nested) return nested
  }
  return ''
}

export function safeArray(value) {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  if (isPlainRecord(value)) return Object.values(value)
  return [value]
}

export function uniqueText(value) {
  const seen = new Set()
  const result = []
  for (const entry of safeArray(value)) {
    const text = asText(entry)
    if (!text) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

export function slugify(value = '') {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function getRecordId(record) {
  if (typeof record === 'string') return record.trim()
  if (typeof record === 'number') return Number.isFinite(record) ? String(record) : ''
  if (Array.isArray(record)) return record.map(getRecordId).find(Boolean) || ''
  if (!isPlainRecord(record)) return ''
  const candidates = [record._id, record.id, record.analysisId, record.resumeId, record.matchId, record.jobId, record.resume, record.analysis, record.job]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
    if (isPlainRecord(candidate)) {
      const nested = getRecordId(candidate)
      if (nested) return nested
    }
  }
  return ''
}

export function unwrapEntity(payload, key) {
  if (isPlainRecord(payload)) {
    if (key && isPlainRecord(payload[key])) return payload[key]
    if (isPlainRecord(payload.data)) {
      if (key && isPlainRecord(payload.data[key])) return payload.data[key]
      return payload.data
    }
  }
  return payload ?? null
}

export function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload
  if (!isPlainRecord(payload)) return []
  const candidates = [payload[key], payload.items, payload.results, payload.docs, payload.records, isPlainRecord(payload.data) ? payload.data[key] : undefined, isPlainRecord(payload.data) ? payload.data.items : undefined]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function countOf(value) {
  if (Array.isArray(value)) return value.length
  const numeric = toNumber(value)
  if (numeric !== null) return Math.max(0, Math.round(numeric))
  return null
}

export function averageScoreOf(items) {
  const values = safeArray(items).map((item) => toScore(item?.score ?? item)).filter((item) => item !== null)
  if (!values.length) return null
  return values.reduce((sum, item) => sum + item, 0) / values.length
}

export function normalizeInsight(value) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? { item: text, title: text, explanation: '', evidence: [], priority: '', importance: '' } : null
  }
  if (!isPlainRecord(value)) return null
  const item = asText(value.item) || asText(value.title) || asText(value.name) || asText(value.label) || asText(value.strength) || asText(value.weakness) || asText(value.keyword) || asText(value.text)
  const explanation = asText(value.explanation) || asText(value.description) || asText(value.detail) || asText(value.reason) || asText(value.note)
  const evidence = uniqueText(value.evidence || value.examples || value.proof)
  const priority = asText(value.priority)
  const importance = asText(value.importance) || asText(value.severity)
  if (!item && !explanation) return null
  return { item, title: item || 'Insight', explanation, evidence, priority, importance }
}

export function normalizeTextList(value) {
  const result = []
  for (const entry of safeArray(value)) {
    if (typeof entry === 'string') {
      const text = entry.trim()
      if (text) result.push(text)
      continue
    }
    if (!isPlainRecord(entry)) continue
    const text = asText(entry.text) || asText(entry.recommendation) || asText(entry.suggestion) || asText(entry.improvement) || asText(entry.title) || asText(entry.name) || asText(entry.label)
    const explanation = asText(entry.explanation) || asText(entry.description) || asText(entry.detail)
    const combined = text && explanation && text !== explanation ? `${text} — ${explanation}` : text || explanation
    if (combined) result.push(combined)
  }
  return result
}

export function normalizeBreakdownItem(value, keyHint = '') {
  if (!isPlainRecord(value)) {
    const score = toScore(value)
    return score === null ? null : { key: slugify(keyHint), label: keyHint || 'Category', score, weight: null, weightedPoints: null, explanation: '', evidence: [] }
  }
  const score = toScore(value.score ?? value.value ?? value.overall ?? value.result)
  const explanation = asText(value.explanation) || asText(value.description) || asText(value.detail) || asText(value.note)
  const label = asText(value.label) || asText(value.name) || asText(value.title) || keyHint || 'Category'
  if (score === null && !explanation) return null
  const key = asText(value.key) || asText(value.id) || slugify(label)
  return {
    key,
    label,
    score: score ?? 0,
    weight: toNumber(value.weight),
    weightedPoints: toNumber(value.weightedPoints ?? value.points),
    explanation,
    evidence: uniqueText(value.evidence || value.examples),
  }
}

export function normalizeBreakdown(source) {
  if (Array.isArray(source)) return source.map((item) => normalizeBreakdownItem(item)).filter(Boolean)
  if (isPlainRecord(source)) {
    return Object.entries(source)
      .map(([key, value]) => normalizeBreakdownItem(isPlainRecord(value) ? { key, ...value } : { key, score: value }, key))
      .filter(Boolean)
  }
  return []
}

export function getBreakdownScore(breakdown, keys = []) {
  const wanted = keys.map((key) => slugify(key))
  const items = safeArray(breakdown)
  for (const key of wanted) {
    const found = items.find((item) => slugify(item?.key) === key || slugify(item?.label) === key)
    if (found) {
      const score = toScore(found.score)
      if (score !== null) return score
    }
  }
  return null
}

function normalizeLinks(value) {
  return safeArray(value)
    .map((entry) => {
      if (typeof entry === 'string') return { label: entry, url: entry }
      if (!isPlainRecord(entry)) return null
      const url = asText(entry.url) || asText(entry.href) || asText(entry.link)
      const label = asText(entry.label) || asText(entry.name) || asText(entry.title) || url
      return url ? { label, url } : null
    })
    .filter(Boolean)
}

function normalizeProfile(source) {
  const record = isPlainRecord(source) ? source : {}
  return {
    fullName: asText(firstDefined(record.fullName, record.full_name, record.name, record.displayName)),
    name: asText(firstDefined(record.name, record.fullName, record.full_name)),
    email: asText(firstDefined(record.email, record.emailAddress, record.mail)),
    phone: asText(firstDefined(record.phone, record.phoneNumber, record.telephone, record.mobile)),
    location: asText(firstDefined(record.location, record.address, record.city, record.country)),
    summary: asText(firstDefined(record.summary, record.professionalSummary, record.about, record.objective, record.bio)),
    links: normalizeLinks(record.links || record.socialLinks || record.profiles || record.urls),
  }
}

function normalizeExperienceItem(value) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? { role: text, title: text, company: '', location: '', startDate: '', endDate: '', duration: '', description: '', highlights: [] } : null
  }
  if (!isPlainRecord(value)) return null
  const role = asText(firstDefined(value.role, value.title, value.position, value.jobTitle, value.designation))
  return {
    role,
    title: asText(firstDefined(value.title, value.role, value.position, value.jobTitle)) || role,
    company: asText(firstDefined(value.company, value.organization, value.employer, value.companyName)),
    location: asText(firstDefined(value.location, value.city, value.place)),
    startDate: asText(firstDefined(value.startDate, value.start, value.from, value.date, value.year)),
    endDate: asText(firstDefined(value.endDate, value.end, value.to, value.current ? 'Present' : undefined)),
    duration: asText(firstDefined(value.duration, value.period, value.length)),
    description: asText(firstDefined(value.description, value.summary, value.details, value.responsibilities)),
    highlights: uniqueText(value.highlights || value.achievements || value.responsibilities || value.accomplishments),
  }
}

function normalizeEducationItem(value) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? { degree: text, field: '', institution: '', startDate: '', endDate: '', year: text, description: '' } : null
  }
  if (!isPlainRecord(value)) return null
  const degree = asText(firstDefined(value.degree, value.qualification, value.level, value.studyType, value.type))
  const institution = asText(firstDefined(value.institution, value.school, value.university, value.college, value.organization))
  const year = asText(firstDefined(value.year, value.graduationYear, value.endYear, value.date))
  return {
    degree,
    field: asText(firstDefined(value.field, value.fieldOfStudy, value.major, value.discipline, value.subject)),
    institution,
    startDate: asText(firstDefined(value.startDate, value.start, value.from, value.year)),
    endDate: asText(firstDefined(value.endDate, value.end, value.to, value.graduationYear, value.year)),
    year,
    description: asText(firstDefined(value.description, value.details, value.notes)),
  }
}

function normalizeProjectItem(value) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? { name: text, title: text, role: '', description: '', technologies: [], skills: [], url: '', startDate: '', endDate: '' } : null
  }
  if (!isPlainRecord(value)) return null
  const name = asText(firstDefined(value.name, value.title, value.project, value.projectName))
  return {
    name,
    title: asText(firstDefined(value.title, value.name)) || name,
    role: asText(firstDefined(value.role, value.position, value.ownership)),
    description: asText(firstDefined(value.description, value.summary, value.details)),
    technologies: uniqueText(value.technologies || value.stack || value.tools),
    skills: uniqueText(value.skills),
    url: asText(firstDefined(value.url, value.link, value.repository)),
    startDate: asText(firstDefined(value.startDate, value.start)),
    endDate: asText(firstDefined(value.endDate, value.end)),
  }
}

function normalizeReferenceItem(value) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? { name: text, issuer: '', date: '', url: '' } : null
  }
  if (!isPlainRecord(value)) return null
  const name = asText(firstDefined(value.name, value.title, value.certification, value.credential, value.language, value.achievement))
  if (!name) return null
  return { name, issuer: asText(value.issuer || value.organization || value.authority), date: asText(value.date || value.year || value.issuedAt), url: asText(value.url || value.credentialUrl || value.link) }
}

export function normalizeResume(input) {
  const source = unwrapEntity(input, 'resume')
  if (!isPlainRecord(source)) return null
  const analysisRef = isPlainRecord(source.analysis) ? source.analysis : null
  const status = slugify(asText(firstDefined(source.status, source.state)) || 'uploaded').replace(/\s+/g, '')
  return {
    id: getRecordId(source),
    name: asText(firstDefined(source.name, source.title, source.originalName, source.fileName)),
    originalName: asText(firstDefined(source.originalName, source.fileName, source.name)),
    fileName: asText(firstDefined(source.fileName, source.originalName, source.name)),
    fileType: asText(firstDefined(source.fileType, source.mimeType, source.type)),
    mimeType: asText(firstDefined(source.mimeType, source.fileType, source.type)),
    fileSize: toNumber(firstDefined(source.fileSize, source.size, source.bytes)) ?? 0,
    status: RESUME_STATUS_MAP[status] || 'uploaded',
    extractionMethod: asText(source.extractionMethod || source.method),
    wordCount: toNumber(source.wordCount) ?? 0,
    characterCount: toNumber(source.characterCount) ?? 0,
    pageCount: toNumber(source.pageCount) ?? 0,
    analysisCount: toNumber(firstDefined(source.analysisCount, source.analysesCount)) ?? (analysisRef ? 1 : 0),
    lastAnalyzedAt: firstDefined(source.lastAnalyzedAt, source.analyzedAt) || null,
    analysis: analysisRef
      ? { id: getRecordId(analysisRef), score: toScore(analysisRef.score ?? analysisRef), label: asText(analysisRef.label), createdAt: analysisRef.createdAt || null }
      : null,
    analysisId: getRecordId(analysisRef) || asText(source.analysisId),
    createdAt: source.createdAt || source.uploadedAt || null,
  }
}

export function normalizeJob(input) {
  const source = unwrapEntity(input, 'job')
  if (!isPlainRecord(source)) return null
  return {
    id: getRecordId(source),
    title: asText(firstDefined(source.title, source.role, source.jobTitle, source.name)),
    company: asText(firstDefined(source.company, source.companyName, source.employer, source.organization)),
    location: asText(firstDefined(source.location, source.city, source.place, source.workplace)),
    employmentType: asText(firstDefined(source.employmentType, source.type, source.jobType)),
    description: asText(firstDefined(source.description, source.requirements, source.details, source.content)),
    url: asText(firstDefined(source.url, source.link, source.applyUrl)),
    skills: uniqueText(source.skills),
    keywords: uniqueText(source.keywords || source.terms),
    notes: asText(source.notes),
    matchCount: countOf(source.matchCount ?? source.matchesCount) ?? 0,
    createdAt: source.createdAt || null,
  }
}

export function normalizeAnalysis(input) {
  const source = unwrapEntity(input, 'analysis')
  if (!isPlainRecord(source)) return null
  const scores = isPlainRecord(source.scores) ? source.scores : {}
  const overallScores = isPlainRecord(scores.overall) ? scores.overall : {}
  const information = isPlainRecord(source.information) ? source.information : {}
  const resumeRef = isPlainRecord(source.resume) ? source.resume : null
  const profileSource = [source.profile, source.candidateInfo, source.personalInfo, source.basics, information].find((entry) => isPlainRecord(entry) && Object.keys(entry).length) || information
  const profile = normalizeProfile(profileSource)
  const scoreBreakdown = normalizeBreakdown(firstDefined(source.scoreBreakdown, source.categories, scores.categories, scores.breakdown, source.breakdown, Array.isArray(source.scores) ? source.scores : undefined))
  const score = toScore(firstDefined(source.score, source.overallScore, source.matchScore, scores.overall?.score, overallScores.score, scores.overall))
  const explanationSource = isPlainRecord(source.explanation) ? source.explanation : {}
  const skills = safeArray(firstDefined(source.skills, information.skills, source.skillList))
  return {
    id: getRecordId(source),
    resume: resumeRef ? normalizeResume(resumeRef) : null,
    resumeId: getRecordId(resumeRef) || asText(source.resumeId),
    resumeName: asText(firstDefined(source.resumeName, source.resumeTitle, resumeRef?.originalName, resumeRef?.name)),
    name: asText(firstDefined(source.name, source.title, source.resumeName)),
    score,
    label: asText(firstDefined(source.label, source.grade, source.rating, overallScores.label)),
    scoreFormula: asText(firstDefined(source.scoreFormula, explanationSource.formula, scores.formula)),
    scoreBreakdown,
    categories: scoreBreakdown,
    profile,
    summary: asText(firstDefined(source.summary, profile.summary, information.summary)),
    skills,
    technicalSkills: uniqueText(firstDefined(source.technicalSkills, information.technicalSkills, source.technical_skills)),
    softSkills: uniqueText(firstDefined(source.softSkills, information.softSkills, source.soft_skills)),
    technologies: uniqueText(firstDefined(source.technologies, information.technologies, source.tools, source.stack)),
    experience: safeArray(firstDefined(source.experience, information.experience, source.workExperience)).map(normalizeExperienceItem).filter(Boolean),
    education: safeArray(firstDefined(source.education, information.education)).map(normalizeEducationItem).filter(Boolean),
    projects: safeArray(firstDefined(source.projects, information.projects)).map(normalizeProjectItem).filter(Boolean),
    certifications: safeArray(firstDefined(source.certifications, information.certifications, source.certificates)).map(normalizeReferenceItem).filter(Boolean),
    languages: safeArray(firstDefined(source.languages, information.languages)).map(normalizeReferenceItem).filter(Boolean),
    achievements: safeArray(firstDefined(source.achievements, information.achievements, source.accomplishments)).map(normalizeReferenceItem).filter(Boolean),
    strengths: safeArray(firstDefined(source.strengths, information.strengths, source.positives)).map(normalizeInsight).filter(Boolean),
    weaknesses: safeArray(firstDefined(source.weaknesses, information.weaknesses, source.negatives, source.areasToImprove)).map(normalizeInsight).filter(Boolean),
    missingInformation: normalizeTextList(firstDefined(source.missingInformation, source.missingInfo, information.missingInformation, source.missingSections)),
    recommendations: normalizeTextList(firstDefined(source.recommendations, source.improvements, source.improvementSuggestions, information.recommendations, source.suggestions)),
    explanation: {
      strongPoints: normalizeTextList(firstDefined(explanationSource.strongPoints, source.strongPoints, source.summaryHighlights)),
      areasToImprove: normalizeTextList(firstDefined(explanationSource.areasToImprove, source.areasToImprove, source.weaknesses)),
      formula: asText(firstDefined(explanationSource.formula, source.scoreFormula)),
      disclaimer: asText(firstDefined(explanationSource.disclaimer, source.disclaimer)),
    },
    createdAt: source.createdAt || source.completedAt || null,
  }
}

function normalizeMatchItem(value) {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? { item: text, explanation: '', importance: '', evidence: [] } : null
  }
  if (!isPlainRecord(value)) return null
  const item = asText(firstDefined(value.item, value.title, value.name, value.skill, value.keyword, value.text, value.label))
  const explanation = asText(firstDefined(value.explanation, value.description, value.detail, value.reason, value.note))
  if (!item && !explanation) return null
  return {
    item,
    explanation,
    importance: asText(firstDefined(value.importance, value.severity, value.priority, value.level)),
    evidence: uniqueText(value.evidence || value.examples),
  }
}

function normalizeEducationCompatibility(value) {
  if (value === null || value === undefined || value === '') return null
  const score = toScore(value)
  if (score !== null && !isPlainRecord(value)) return { score, label: '', explanation: '', evidence: [] }
  if (!isPlainRecord(value)) return null
  const resolved = toScore(value.score ?? value.value ?? value.compatibility)
  return {
    score: resolved,
    label: asText(value.label || value.rating || value.result),
    explanation: asText(value.explanation || value.description || value.detail || value.reason),
    evidence: uniqueText(value.evidence || value.examples),
  }
}

function normalizeCategoryScores(match, breakdown) {
  const record = isPlainRecord(match.categoryScores) ? match.categoryScores : {}
  const legacy = isPlainRecord(match.scores) ? match.scores : {}
  const result = {}
  for (const key of MATCH_CATEGORY_KEYS) {
    const direct = toScore(firstDefined(record[key], legacy[key], record[`${key}Score`], legacy[`${key}Score`], match[`${key}Score`]))
    result[key] = direct ?? getBreakdownScore(breakdown, [key, `${key} coverage`, `${key} alignment`])
  }
  return result
}

export function normalizeMatch(input) {
  const source = unwrapEntity(input, 'match')
  if (!isPlainRecord(source)) return null
  const jobSource = isPlainRecord(source.job) ? source.job : null
  const job = jobSource
    ? {
        id: getRecordId(jobSource),
        title: asText(firstDefined(jobSource.title, jobSource.role)),
        company: asText(firstDefined(jobSource.company, jobSource.companyName)),
        location: asText(jobSource.location),
        employmentType: asText(firstDefined(jobSource.employmentType, jobSource.type)),
        url: asText(firstDefined(jobSource.url, jobSource.applyUrl, jobSource.link)),
      }
    : {
        id: asText(source.jobId),
        title: asText(firstDefined(source.jobTitle, source.title)),
        company: asText(firstDefined(source.company, source.companyName)),
        location: asText(firstDefined(source.jobLocation, source.location)),
        employmentType: asText(source.employmentType),
        url: asText(firstDefined(source.jobUrl, source.url)),
      }
  const resumeSource = isPlainRecord(source.resume) ? source.resume : null
  const analysisSource = isPlainRecord(source.analysis) ? source.analysis : null
  const scoreBreakdown = normalizeBreakdown(firstDefined(source.scoreBreakdown, source.categories, source.breakdown))
  const score = toScore(firstDefined(source.score, source.matchScore, source.overallScore, source.compatibilityScore, source.compatibility))
  const explanationSource = source.explanation
  return {
    id: getRecordId(source),
    job,
    jobId: job.id,
    resume: resumeSource
      ? { id: getRecordId(resumeSource), name: asText(resumeSource.name), originalName: asText(firstDefined(resumeSource.originalName, resumeSource.name)) }
      : { id: asText(source.resumeId), name: asText(firstDefined(source.resumeName, source.resumeOriginalName)), originalName: asText(firstDefined(source.resumeOriginalName, source.resumeName)) },
    resumeId: getRecordId(resumeSource) || asText(source.resumeId),
    analysis: analysisSource ? { id: getRecordId(analysisSource), name: asText(firstDefined(analysisSource.name, analysisSource.resumeName)) } : { id: asText(source.analysisId), name: asText(source.analysisName) },
    analysisId: getRecordId(analysisSource) || asText(source.analysisId),
    score,
    label: asText(firstDefined(source.label, source.grade, source.rating)),
    scoreBreakdown,
    categoryScores: normalizeCategoryScores(source, scoreBreakdown),
    matchingSkills: uniqueText(firstDefined(source.matchingSkills, source.matchedSkills)),
    missingSkills: uniqueText(firstDefined(source.missingSkills, source.skillsToAdd, source.unmatchedSkills)),
    additionalSkills: uniqueText(source.additionalSkills || source.extraSkills),
    matchingExperience: safeArray(firstDefined(source.matchingExperience, source.experienceMatches)).map(normalizeMatchItem).filter(Boolean),
    missingExperience: safeArray(firstDefined(source.missingExperience, source.experienceGaps)).map(normalizeMatchItem).filter(Boolean),
    educationCompatibility: normalizeEducationCompatibility(firstDefined(source.educationCompatibility, source.educationMatch)),
    keywordMatches: uniqueText(firstDefined(source.keywordMatches, source.matchedKeywords, source.keywordsMatched)),
    strongMatches: safeArray(firstDefined(source.strongMatches, source.strengths)).map(normalizeMatchItem).filter(Boolean),
    gaps: safeArray(firstDefined(source.gaps, source.weaknesses, source.riskFactors)).map(normalizeMatchItem).filter(Boolean),
    recommendations: normalizeTextList(source.recommendations || source.improvements || source.suggestions),
    explanation: asText(explanationSource?.summary ?? explanationSource) || asText(source.matchExplanation),
    createdAt: source.createdAt || null,
  }
}

export function normalizeDashboard(input) {
  const outer = unwrapEntity(input, 'dashboard') || {}
  const source = isPlainRecord(outer.stats) ? outer.stats : outer
  const totalsSource = isPlainRecord(source.totals) ? source.totals : {}
  const recentAnalyses = normalizeList(source.recentAnalyses, 'analyses')
  const recentMatches = normalizeList(source.recentMatches, 'matches')
  const topMatches = normalizeList(source.topMatches, 'matches')
  const recentJobs = normalizeList(source.recentJobs, 'jobs')
  return {
    totals: {
      resumes: countOf(firstDefined(totalsSource.resumes, totalsSource.cvCount, source.resumes)) ?? 0,
      jobs: countOf(firstDefined(totalsSource.jobs, source.jobs)) ?? 0,
      analyses: countOf(firstDefined(totalsSource.analyses, source.analyses)) ?? 0,
      matches: countOf(firstDefined(totalsSource.matches, source.matches)) ?? 0,
    },
    averageScore: toScore(firstDefined(source.averageScore, source.averageOverallScore, source.avgScore)),
    highestScore: toScore(firstDefined(source.highestScore, source.bestScore, source.maxScore)),
    averageMatch: toScore(firstDefined(source.averageMatch, source.averageMatchScore, source.avgMatch)),
    latestScore: toScore(firstDefined(source.latestScore, source.lastScore)),
    recentAnalyses,
    recentMatches,
    topMatches,
    recentJobs,
  }
}

export function normalizeComparisonPayload(input) {
  const source = isPlainRecord(input) ? input : {}
  const analyses = normalizeList(source.analyses || source.results, 'analyses')
  const first = unwrapEntity(source.first, 'analysis') || analyses[0] || null
  const second = unwrapEntity(source.second, 'analysis') || analyses[1] || null
  return {
    first: normalizeAnalysis(first),
    second: normalizeAnalysis(second),
    analyses: analyses.map(normalizeAnalysis).filter(Boolean),
    summary: normalizeTextList(source.summary || source.notes || source.highlights),
  }
}

export function normalizeSettings(input) {
  const source = unwrapEntity(input, 'settings')
  const record = isPlainRecord(source) ? source : {}
  const theme = slugify(asText(record.theme)).replace(/\s+/g, '')
  return {
    name: asText(firstDefined(record.name, record.fullName, record.displayName)),
    email: asText(record.email),
    targetRole: asText(firstDefined(record.targetRole, record.role, record.targetTitle, record.jobTitle)),
    preferredLanguage: asText(firstDefined(record.preferredLanguage, record.language, record.locale)),
    theme: THEME_VALUES.includes(theme) ? theme : '',
  }
}

export function normalizePasswordResult(input) {
  const source = isPlainRecord(input) ? input : {}
  return {
    passwordChanged: firstDefined(source.passwordChanged, source.changed) ?? false,
    reauthenticationRequired: firstDefined(source.reauthenticationRequired, source.reauthenticate, source.requiresReauthentication) ?? false,
  }
}
