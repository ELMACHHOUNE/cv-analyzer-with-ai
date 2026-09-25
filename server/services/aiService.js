import { getAiConfig } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { calculateMatchOverall, MATCH_SCORE_WEIGHTS, getScoreLabel } from '../utils/scoreCalculator.js';
import {
  jobAnalysisSchema,
  matchAnalysisSchema,
  recommendationsSchema,
  resumeAnalysisSchema,
  resumeImprovementSchema,
  resumeInformationSchema
} from './aiSchemas.js';

const promptVersion = '2026-09-1';
const baseSystemPrompt = [
  'You are a careful educational CV analysis engine.',
  'Use only facts explicitly present in the supplied source material.',
  'Never invent names, employers, dates, skills, education, metrics, URLs, or job requirements.',
  'If evidence is absent, return null, an empty array, or state that it was not found.',
  'When quoting evidence, copy an exact contiguous span from the source and preserve its meaning.',
  'Return one JSON object only. Do not use Markdown fences, commentary, or surrounding prose.',
  'Keep summaries concise, use short bullet-like strings, and never promise hiring or interview outcomes.'
].join(' ');

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

function canonical(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function trimmedText(value, maximum) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`AI response is missing a valid ${label} object`, 502, 'AI_INVALID_RESPONSE');
  }
  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new AppError(`AI response is missing a valid ${label} array`, 502, 'AI_INVALID_RESPONSE');
  }
  return value;
}

function nullableString(value, field, maximum) {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`AI response has an invalid ${field}`, 502, 'AI_INVALID_RESPONSE');
  }
  return trimmedText(value, maximum) || null;
}

function stringList(value, field, { maximumItems = 50, maximumLength = 240 } = {}) {
  return requireArray(value, field)
    .slice(0, maximumItems)
    .filter((item) => typeof item === 'string')
    .map((item) => trimmedText(item, maximumLength))
    .filter(Boolean);
}

function uniqueBy(values, keyFunction = canonical) {
  const seen = new Set();
  return values.filter((value) => {
    const key = keyFunction(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceText(value) {
  return canonical(value).slice(0, 350000);
}

function keepSourceTerms(values, source, maximumItems = 50, maximumLength = 120) {
  const normalizedSource = sourceText(source);
  return uniqueBy(values
    .map((value) => trimmedText(value, maximumLength))
    .filter((value) => canonical(value) && normalizedSource.includes(canonical(value))), (value) => canonical(value))
    .slice(0, maximumItems);
}

function keepEvidence(values, source, maximumItems = 6) {
  const normalizedSource = sourceText(source);
  return uniqueBy(requireArray(values, 'evidence')
    .filter((value) => typeof value === 'string')
    .map((value) => trimmedText(value, 240))
    .filter((value) => normalizedSource.includes(canonical(value))), (value) => canonical(value))
    .slice(0, maximumItems);
}

function normalizeEntry(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entry = {};
  for (const [field, maximum] of Object.entries(fields)) {
    const normalized = nullableString(value[field], field, maximum);
    if (normalized) entry[field] = normalized;
  }
  return Object.keys(entry).length ? entry : null;
}

function normalizeResumeEntries(value, field, source) {
  const normalizedSource = sourceText(source);
  return requireArray(value, field).slice(0, 30).map((entry) => normalizeEntry(entry, {
    role: 160,
    company: 160,
    startDate: 80,
    endDate: 80,
    duration: 120,
    degree: 160,
    field: 160,
    institution: 160,
    year: 80,
    name: 160,
    description: 1200
  })).filter((entry) => entry && Object.values(entry).some((fieldValue) => normalizedSource.includes(canonical(fieldValue))));
}

export function normalizeResumeInformation(value, sourceTextValue) {
  const data = requireObject(value, 'resume information');
  const source = sourceTextValue || '';
  const normalizedSource = sourceText(source);
  const safeScalar = (field, maximum) => {
    const result = nullableString(data[field], field, maximum);
    return result && normalizedSource.includes(canonical(result)) ? result : null;
  };
  const hasSkillSplit = data.technicalSkills !== undefined || data.softSkills !== undefined;
  const technicalSkills = keepSourceTerms(
    stringList(hasSkillSplit ? data.technicalSkills : data.skills, 'technicalSkills', { maximumLength: 120 }),
    source
  );
  const softSkills = keepSourceTerms(
    stringList(data.softSkills, 'softSkills', { maximumLength: 120 }),
    source
  );
  return {
    name: safeScalar('name', 160),
    email: safeScalar('email', 254),
    phone: safeScalar('phone', 80),
    location: safeScalar('location', 240),
    links: keepSourceTerms(stringList(data.links, 'links'), source, 20),
    skills: uniqueBy([...technicalSkills, ...softSkills], canonical),
    technicalSkills,
    softSkills,
    technologies: technicalSkills,
    experience: normalizeResumeEntries(data.experience, 'experience', source),
    education: normalizeResumeEntries(data.education, 'education', source),
    projects: normalizeResumeEntries(data.projects, 'projects', source),
    certifications: keepSourceTerms(stringList(data.certifications, 'certifications'), source, 30),
    languages: keepSourceTerms(stringList(data.languages, 'languages'), source, 20),
    achievements: keepSourceTerms(stringList(data.achievements, 'achievements', { maximumLength: 400 }), source, 30, 400)
  };
}

function normalizeInsights(value, field, source, { requireEvidence }) {
  return requireArray(value, field).slice(0, 10).map((item) => {
    const insight = requireObject(item, field);
    const evidence = keepEvidence(insight.evidence, source);
    if (requireEvidence && !evidence.length) return null;
    return {
      title: trimmedText(insight.title, 120),
      explanation: trimmedText(insight.explanation, 600),
      evidence,
      ...(['high', 'medium', 'low'].includes(insight.priority) ? { priority: insight.priority } : {})
    };
  }).filter((item) => item && item.title && item.explanation);
}

export function normalizeResumeAnalysis(value, sourceTextValue) {
  const data = requireObject(value, 'resume analysis');
  const source = sourceTextValue || '';
  const summary = trimmedText(data.summary, 600);
  if (!summary) {
    throw new AppError('AI response is missing a resume summary', 502, 'AI_INVALID_RESPONSE');
  }
  return {
    information: normalizeResumeInformation(data.information, source),
    summary,
    strengths: normalizeInsights(data.strengths, 'strengths', source, { requireEvidence: true }),
    improvements: normalizeInsights(data.improvements, 'improvements', source, { requireEvidence: false }),
    recommendations: stringList(data.recommendations, 'recommendations', { maximumItems: 8, maximumLength: 400 })
  };
}

export function normalizeJobAnalysis(value, sourceTextValue) {
  const data = requireObject(value, 'job analysis');
  const source = sourceTextValue || '';
  const normalizedSource = sourceText(source);
  const summary = trimmedText(data.summary, 800);
  if (!summary) {
    throw new AppError('AI response is missing a job summary', 502, 'AI_INVALID_RESPONSE');
  }
  const requirements = requireArray(data.requirements, 'requirements').slice(0, 50).map((item) => {
    const requirement = requireObject(item, 'requirement');
    const text = trimmedText(requirement.text, 300);
    const categories = ['skill', 'experience', 'education', 'certification', 'language', 'other'];
    if (!text || typeof requirement.required !== 'boolean' || !categories.includes(requirement.category)) {
      throw new AppError('AI response has an invalid job requirement', 502, 'AI_INVALID_RESPONSE');
    }
    return { text, required: requirement.required, category: requirement.category };
  }).filter((item) => normalizedSource.includes(canonical(item.text)));
  return {
    summary,
    skills: keepSourceTerms(stringList(data.skills, 'job skills', { maximumLength: 120 }), source),
    keywords: keepSourceTerms(stringList(data.keywords, 'job keywords', { maximumLength: 120 }), source),
    responsibilities: stringList(data.responsibilities, 'responsibilities', { maximumItems: 30, maximumLength: 400 })
      .filter((item) => normalizedSource.includes(canonical(item))),
    requirements,
    experienceRequirements: trimmedText(data.experienceRequirements, 500),
    educationRequirements: trimmedText(data.educationRequirements, 500),
    languageRequirements: keepSourceTerms(stringList(data.languageRequirements, 'languageRequirements', { maximumLength: 160 }), source, 20),
    sourceEvidence: keepEvidence(data.sourceEvidence, source, 12)
  };
}

function scoreInput(value, field, source) {
  const data = requireObject(value, field);
  const rawScore = Number(data.score);
  if (!Number.isFinite(rawScore)) {
    throw new AppError(`AI response has an invalid ${field} score`, 502, 'AI_INVALID_RESPONSE');
  }
  return {
    score: Math.round(clamp(rawScore)),
    explanation: trimmedText(data.explanation, 500),
    evidence: keepEvidence(data.evidence, source, 6)
  };
}

export function normalizeMatchResult(value, { source, resumeInformation = {}, jobAnalysis = {} } = {}) {
  const data = requireObject(value, 'match analysis');
  const categoryValues = requireObject(data.categories, 'match categories');
  const categoryInputs = {};
  for (const category of Object.keys(MATCH_SCORE_WEIGHTS)) {
    categoryInputs[category] = scoreInput(categoryValues[category], `${category} category`, source);
    if (!categoryInputs[category].explanation) {
      throw new AppError(`AI response is missing ${category} explanation`, 502, 'AI_INVALID_RESPONSE');
    }
  }
  const calculated = calculateMatchOverall(categoryInputs);
  for (const category of Object.keys(MATCH_SCORE_WEIGHTS)) {
    calculated.categories[category].explanation = categoryInputs[category].explanation;
    calculated.categories[category].evidence = categoryInputs[category].evidence;
    calculated.categories[category].label = getScoreLabel(calculated.categories[category].score);
  }
  const jobSkillPool = new Set([...(jobAnalysis.skills || []), ...(jobAnalysis.requirements || []).map((item) => item.text)].map(canonical));
  const resumeSkillPool = new Set((resumeInformation.skills || []).map(canonical));
  const matchedSkills = keepSourceTerms(stringList(data.matchedSkills, 'matchedSkills', { maximumLength: 120 }), source, 50)
    .filter((skill) => jobSkillPool.has(canonical(skill)) || resumeSkillPool.has(canonical(skill)));
  const missingSkills = keepSourceTerms(stringList(data.missingSkills, 'missingSkills', { maximumLength: 120 }), source, 50)
    .filter((skill) => jobSkillPool.has(canonical(skill)) && !resumeSkillPool.has(canonical(skill)));
  const additionalSkills = keepSourceTerms(stringList(data.additionalSkills, 'additionalSkills', { maximumLength: 120 }), source, 50)
    .filter((skill) => resumeSkillPool.has(canonical(skill)) && !jobSkillPool.has(canonical(skill)));
  const gaps = requireArray(data.gaps, 'gaps').slice(0, 30).map((item) => {
    const gap = requireObject(item, 'gap');
    const normalizedItem = trimmedText(gap.item, 160);
    const importance = gap.importance === 'required' || gap.importance === 'preferred' ? gap.importance : 'preferred';
    if (!normalizedItem || typeof gap.explanation !== 'string' || !jobSkillPool.has(canonical(normalizedItem))) return null;
    return { item: normalizedItem, importance, explanation: trimmedText(gap.explanation, 500) };
  }).filter((item) => item && item.explanation);
  const explanation = trimmedText(data.explanation, 900);
  const recommendation = trimmedText(data.recommendation, 700);
  if (!explanation || !recommendation) {
    throw new AppError('AI response is missing a match explanation', 502, 'AI_INVALID_RESPONSE');
  }
  return {
    scores: calculated,
    matchedSkills,
    missingSkills,
    additionalSkills,
    gaps,
    explanation,
    recommendation
  };
}

export function normalizeRecommendations(value, sourceTextValue) {
  const data = requireObject(value, 'recommendations');
  const source = sourceTextValue || '';
  const stated = stringList(data.recommendations, 'recommendations', { maximumItems: 8, maximumLength: 400 });
  const actions = requireArray(data.priorityActions, 'priority action').slice(0, 8).map((item) => {
    const action = requireObject(item, 'priority action');
    return {
      action: trimmedText(action.action, 400),
      rationale: trimmedText(action.rationale, 500),
      evidence: keepEvidence(action.evidence, source, 4)
    };
  }).filter((item) => item.action && item.rationale);
  /* The provider sometimes returns the actions only. Reusing the model's own
     action text keeps the endpoint useful instead of discarding a valid answer. */
  const recommendations = stated.length
    ? stated
    : uniqueBy(actions.map((item) => item.action), canonical).slice(0, 8);
  if (!recommendations.length || !actions.length) {
    throw new AppError('AI response did not include usable recommendations', 502, 'AI_INVALID_RESPONSE');
  }
  return { recommendations, priorityActions: actions };
}

export function normalizeResumeImprovement(value, sourceTextValue) {
  const data = requireObject(value, 'resume improvement');
  const source = sourceTextValue || '';
  const revisions = requireArray(data.revisions, 'revisions').slice(0, 12).map((item) => {
    const revision = requireObject(item, 'revision');
    const original = trimmedText(revision.original, 1600);
    const revised = trimmedText(revision.revised, 1600);
    const sourceEvidence = keepEvidence(revision.sourceEvidence, source, 4);
    if (!original || !revised || !sourceEvidence.length || !sourceText(source).includes(canonical(original))) return null;
    return {
      section: trimmedText(revision.section, 100) || 'General',
      original,
      revised,
      rationale: trimmedText(revision.rationale, 500),
      sourceEvidence
    };
  }).filter(Boolean);
  if (!revisions.length) {
    throw new AppError('AI response did not include a source-grounded improvement', 502, 'AI_INVALID_RESPONSE');
  }
  return {
    revisions,
    suggestions: stringList(data.suggestions, 'suggestions', { maximumItems: 10, maximumLength: 400 }),
    guardrail: 'No new experience, skills, dates, metrics, or qualifications were added.'
  };
}

function trimForPrompt(value, maximum = 24000) {
  const text = String(value || '').trim();
  if (text.length <= maximum) return text;
  const tailLength = Math.floor(maximum * 0.3);
  return `${text.slice(0, maximum - tailLength)}\n[TRIMMED]\n${text.slice(-tailLength)}`;
}

/*
  Upstream provider failures are the single most common cause of a failed
  analysis, and a bare 502 hides the reason. Read the provider body once, log
  it, and translate it into a code the API and the UI can act on.
*/
async function readProviderFailure(response) {
  const failure = { upstreamStatus: response.status };
  try {
    const raw = await response.text();
    if (!raw) return failure;
    try {
      const parsed = JSON.parse(raw);
      const code = String(parsed?.code || parsed?.error?.code || '').trim().slice(0, 80);
      const message = String(parsed?.error?.message || parsed?.error || parsed?.message || '').trim().slice(0, 300);
      if (code) failure.upstreamCode = code;
      if (message) failure.upstreamMessage = message;
    } catch {
      failure.upstreamMessage = raw.trim().slice(0, 300);
    }
  } catch {
    /* body already consumed or unreadable â€” the status alone is enough */
  }
  return failure;
}

function providerError(response, failure, model) {
  const status = response.status;
  const upstream = String(failure.upstreamCode || '').toLowerCase();
  const creditsExhausted = status === 403 && (upstream.includes('permission') || upstream.includes('credit') || upstream.includes('quota'));
  if (creditsExhausted) {
    return new AppError(
      'The AI provider rejected the request: the account has no credits left or has reached its spending limit',
      502,
      'AI_CREDITS_EXHAUSTED'
    );
  }
  if (status === 401 || status === 403) {
    return new AppError('The AI provider rejected the configured API key', 502, 'AI_ACCESS_DENIED');
  }
  if (status === 404) {
    return new AppError(`The configured AI model "${model}" was not found by the provider`, 502, 'AI_MODEL_NOT_FOUND');
  }
  if (status === 429) {
    return new AppError('The AI provider rate limit was reached. Try again in a moment.', 503, 'AI_RATE_LIMITED');
  }
  return new AppError('AI analysis is temporarily unavailable', 502, 'AI_UNAVAILABLE');
}

function logProviderFailure(config, failure) {
  console.error('AI provider request failed', {
    provider: config.provider || 'unknown',
    model: config.model,
    endpoint: config.endpoint,
    ...failure
  });
}

function parseJsonContent(content) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new AppError('AI returned an empty response', 502, 'AI_INVALID_RESPONSE');
  }
  let value = content.trim();
  const fence = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) value = fence[1].trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start !== 0 || end !== value.length - 1) {
    throw new AppError('AI returned malformed JSON', 502, 'AI_INVALID_RESPONSE');
  }
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError('AI returned malformed JSON', 502, 'AI_INVALID_RESPONSE');
  }
}

function buildChatRequestBody({ systemPrompt, userPrompt, schemaName, schema }, config) {
  /* Chat Completions shape. `store`, `logprobs`, `metadata`, and
     `max_completion_tokens`-less calls are rejected by Groq, so the body stays
     limited to fields the provider documents. */
  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_completion_tokens: 6000,
    temperature: 0
  };
  if (schemaName && schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        schema,
        strict: false
      }
    };
  }
  return body;
}

function buildResponsesRequestBody({ systemPrompt, userPrompt, schemaName, schema }, config) {
  const body = {
    model: config.model,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_output_tokens: 6000,
    store: false
  };
  if (schemaName && schema) {
    /* Responses API shape: name/schema/strict are direct children of `format`.
       Nesting them under a `json_schema` object is the Chat Completions shape
       and is rejected with 422 "text.format: missing field `schema`". */
    body.text = {
      format: {
        type: 'json_schema',
        name: schemaName,
        schema,
        strict: false
      }
    };
  }
  return body;
}

function buildRequestBody(prompt, config) {
  return config.apiStyle === 'chat'
    ? buildChatRequestBody(prompt, config)
    : buildResponsesRequestBody(prompt, config);
}

/* Degrade to the loosest structured mode the provider still accepts instead of
   failing the whole analysis on a schema-related 400. */
function withoutSchemaConstraint(body, apiStyle) {
  if (apiStyle === 'chat') {
    return body.response_format ? { ...body, response_format: { type: 'json_object' } } : null;
  }
  return body.text ? { ...body, text: undefined } : null;
}

function extractResponsesText(payload) {
  if (payload?.status === 'incomplete' || payload?.incomplete_details) {
    throw new AppError('AI returned an incomplete response', 502, 'AI_INVALID_RESPONSE');
  }
  if (!Array.isArray(payload?.output)) {
    throw new AppError('AI returned an unreadable response', 502, 'AI_INVALID_RESPONSE');
  }
  const parts = [];
  for (const item of payload.output) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (content?.type === 'refusal' || typeof content?.refusal === 'string') {
        throw new AppError('AI declined to return structured output', 502, 'AI_INVALID_RESPONSE');
      }
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('');
}

function extractChatText(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  if (!choice || typeof choice !== 'object') {
    throw new AppError('AI returned an unreadable response', 502, 'AI_INVALID_RESPONSE');
  }
  /* A length stop means the JSON object was cut mid-write, so the failure is
     reported as truncation instead of a misleading "malformed JSON". */
  if (choice.finish_reason === 'length') {
    throw new AppError('AI response was cut off before the JSON was complete', 502, 'AI_INVALID_RESPONSE');
  }
  if (typeof choice.message?.refusal === 'string' && choice.message.refusal) {
    throw new AppError('AI declined to return structured output', 502, 'AI_INVALID_RESPONSE');
  }
  return choice.message?.content;
}

function extractOutputText(payload, apiStyle) {
  return apiStyle === 'chat' ? extractChatText(payload) : extractResponsesText(payload);
}

export async function requestProviderJson(prompt, dependencies = {}) {
  const config = dependencies.config || getAiConfig();
  if (!config.apiKey) {
    throw new AppError('AI analysis is not configured', 503, 'AI_NOT_CONFIGURED');
  }
  const apiStyle = config.apiStyle || 'responses';
  const fetchImplementation = dependencies.fetchImpl || globalThis.fetch;
  if (typeof fetchImplementation !== 'function') {
    throw new Error('Fetch is not available');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const send = async (body) => fetchImplementation(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  let payload;
  try {
    const structuredBody = buildRequestBody(prompt, config);
    let response = await send(structuredBody);
    if (response.status === 400) {
      const fallbackBody = withoutSchemaConstraint(structuredBody, apiStyle);
      if (fallbackBody) {
        response = await send(fallbackBody);
      }
    }
    if (!response.ok) {
      const failure = await readProviderFailure(response);
      logProviderFailure(config, failure);
      throw providerError(response, failure, config.model);
    }
    try {
      payload = await response.json();
    } catch {
      throw new AppError('AI returned an unreadable response', 502, 'AI_INVALID_RESPONSE');
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new AppError('AI analysis timed out', 504, 'AI_TIMEOUT');
    }
    logProviderFailure(config, { networkError: error?.name || 'Error', upstreamMessage: error?.message });
    throw new AppError('AI analysis is temporarily unavailable', 502, 'AI_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
  return {
    data: parseJsonContent(extractOutputText(payload, apiStyle)),
    model: config.model,
    provider: config.provider || 'unknown',
    promptVersion
  };
}

function analysisInstructions(source) {
  return `Return this exact JSON shape:
{"information":{"name":null,"email":null,"phone":null,"location":null,"links":[],"skills":[],"technicalSkills":[],"softSkills":[],"experience":[],"education":[],"projects":[],"certifications":[],"languages":[],"achievements":[]},"summary":"","strengths":[{"title":"","explanation":"","evidence":["exact source quote"]}],"improvements":[{"title":"","explanation":"","evidence":[],"priority":"high|medium|low"}],"recommendations":["one concrete next step","another concrete next step"]}
 Split skills into technicalSkills (tools, languages, frameworks, platforms, methodologies) and softSkills (communication, teamwork, leadership, ownership). List every skill in exactly one of the two arrays, repeat skills array as their union, and only list a skill that appears in the source. Experience, education, project, certification, language, and achievement entries must use only source-supported fields. Always return at least one strength and at least two recommendations, and use an empty array only when the source genuinely contains nothing for that list. The source is:
${JSON.stringify(source)}`;
}

export async function analyzeResume(resumeText, dependencies = {}) {
  const source = trimForPrompt(resumeText);
  if (!source) {
    throw new AppError('Resume text is required for AI analysis', 400, 'RESUME_TEXT_REQUIRED');
  }
  const response = await requestProviderJson({
    systemPrompt: baseSystemPrompt,
    userPrompt: analysisInstructions(source),
    schemaName: 'resume_analysis',
    schema: resumeAnalysisSchema
  }, dependencies);
  return {
    ...normalizeResumeAnalysis(response.data, source),
    model: response.model,
    promptVersion: response.promptVersion
  };
}

export async function extractResumeInformation(resumeText, dependencies = {}) {
  const source = trimForPrompt(resumeText);
  if (!source) {
    throw new AppError('Resume text is required for extraction', 400, 'RESUME_TEXT_REQUIRED');
  }
  const response = await requestProviderJson({
    systemPrompt: baseSystemPrompt,
    userPrompt: `Extract only explicit resume information and return the information object from this exact shape: {"information":{"name":null,"email":null,"phone":null,"location":null,"links":[],"skills":[],"technicalSkills":[],"softSkills":[],"experience":[],"education":[],"projects":[],"certifications":[],"languages":[],"achievements":[]}}. Source: ${JSON.stringify(source)}`,
    schemaName: 'resume_information',
    schema: resumeInformationSchema
  }, dependencies);
  return normalizeResumeInformation(response.data.information, source);
}

export async function analyzeJobDescription(description, dependencies = {}) {
  const source = trimForPrompt(description, 30000);
  if (!source) {
    throw new AppError('Job description is required', 400, 'JOB_DESCRIPTION_REQUIRED');
  }
  const response = await requestProviderJson({
    systemPrompt: `${baseSystemPrompt} Distinguish required qualifications from preferences and do not scrape or infer from a URL.`,
    userPrompt: `Return {"summary":"","skills":[],"keywords":[],"responsibilities":[],"requirements":[{"text":"","required":true,"category":"skill|experience|education|certification|language|other"}],"experienceRequirements":"","educationRequirements":"","languageRequirements":[],"sourceEvidence":[]} using only this manually pasted description: ${JSON.stringify(source)}`,
    schemaName: 'job_analysis',
    schema: jobAnalysisSchema
  }, dependencies);
  return normalizeJobAnalysis(response.data, source);
}

export async function matchResumeWithJob({ resumeText, resumeInformation, resumeScores, jobDescription, jobAnalysis }, dependencies = {}) {
  const source = trimForPrompt(`Resume source:\n${resumeText}\nJob description:\n${jobDescription}\nStructured job analysis:\n${JSON.stringify(jobAnalysis)}`, 32000);
  if (!resumeText || !jobDescription) {
    throw new AppError('Resume text and job description are required', 400, 'MATCH_INPUT_REQUIRED');
  }
  const response = await requestProviderJson({
    systemPrompt: `${baseSystemPrompt} Compare evidence only. A missing requirement is a gap, not a failure, and no category may claim a fact not present in either source.`,
    userPrompt: `Return {"categories":{"skills":{"score":0,"explanation":"","evidence":[]},"experience":{"score":0,"explanation":"","evidence":[]},"education":{"score":0,"explanation":"","evidence":[]},"keywords":{"score":0,"explanation":"","evidence":[]},"impact":{"score":0,"explanation":"","evidence":[]},"completeness":{"score":0,"explanation":"","evidence":[]}},"matchedSkills":[],"missingSkills":[],"additionalSkills":[],"gaps":[{"item":"","importance":"required|preferred","explanation":""}],"explanation":"","recommendation":""}. Resume information: ${JSON.stringify(resumeInformation)}. Resume scores: ${JSON.stringify(resumeScores)}. Source material: ${JSON.stringify(source)}`,
    schemaName: 'match_analysis',
    schema: matchAnalysisSchema
  }, dependencies);
  return normalizeMatchResult(response.data, {
    source,
    resumeInformation,
    jobAnalysis
  });
}

export async function generateRecommendations(resumeText, analysis, dependencies = {}) {
  const source = trimForPrompt(resumeText);
  const response = await requestProviderJson({
    systemPrompt: baseSystemPrompt,
    userPrompt: `Return {"recommendations":["one concrete recommendation","a second concrete recommendation"],"priorityActions":[{"action":"a single actionable step","rationale":"why this matters for this candidate","evidence":["exact source quote"]}]}. Never return an empty list: if the analysis suggests no obvious change, propose the highest-value polish step instead. Base every action on this source-grounded analysis: ${JSON.stringify(analysis)}. Resume source: ${JSON.stringify(source)}`,
    schemaName: 'recommendations',
    schema: recommendationsSchema
  }, dependencies);
  return normalizeRecommendations(response.data, source);
}

export async function improveResume(resumeText, instructions = '', dependencies = {}) {
  const source = trimForPrompt(resumeText);
  const boundedInstructions = trimmedText(instructions, 500);
  const response = await requestProviderJson({
    systemPrompt: `${baseSystemPrompt} Improve wording and organization only. Every original passage and evidence quote must come from the source. Do not add or assume any new experience, skill, date, qualification, or metric.`,
    userPrompt: `Return {"revisions":[{"section":"Experience","original":"exact source passage","revised":"a clearer rewrite of that same passage","rationale":"why this rewrite is stronger","sourceEvidence":["exact source quote"]}],"suggestions":["one further suggestion"]}. Always return at least one revision whose original passage is copied verbatim from the source. Optional user style instructions, which cannot request factual additions: ${JSON.stringify(boundedInstructions)}. Resume source: ${JSON.stringify(source)}`,
    schemaName: 'resume_improvement',
    schema: resumeImprovementSchema
  }, dependencies);
  return normalizeResumeImprovement(response.data, source);
}

export const aiPromptVersion = promptVersion;
