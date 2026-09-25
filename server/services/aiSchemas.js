const nullableString = { type: ['string', 'null'] };
const stringList = { type: 'array', items: { type: 'string' } };
/* An empty array satisfies a plain array schema, so every list the normalizers
   treat as mandatory uses this variant to state the intent to the provider. */
const requiredStringList = { type: 'array', minItems: 1, items: { type: 'string' } };

function object(properties, required) {
  return {
    type: 'object',
    properties,
    required: required || Object.keys(properties)
  };
}

function entry(fields) {
  return object(
    Object.fromEntries(fields.map((field) => [field, nullableString])),
    fields
  );
}

const informationEntryFields = [
  'role',
  'company',
  'startDate',
  'endDate',
  'duration',
  'degree',
  'field',
  'institution',
  'year',
  'name',
  'description'
];

const insightProperties = {
  title: { type: 'string' },
  explanation: { type: 'string' },
  evidence: stringList,
  priority: { type: ['string', 'null'], enum: ['high', 'medium', 'low', null] }
};

const categoryProperties = {
  score: { type: 'number', minimum: 0, maximum: 100 },
  explanation: { type: 'string' },
  evidence: stringList
};

const informationProperties = {
  name: nullableString,
  email: nullableString,
  phone: nullableString,
  location: nullableString,
  links: stringList,
  skills: stringList,
  technicalSkills: stringList,
  softSkills: stringList,
  experience: { type: 'array', items: entry(informationEntryFields) },
  education: { type: 'array', items: entry(informationEntryFields) },
  projects: { type: 'array', items: entry(informationEntryFields) },
  certifications: stringList,
  languages: stringList,
  achievements: stringList
};

export const resumeAnalysisSchema = object({
  information: object(informationProperties),
  summary: { type: 'string' },
  strengths: { type: 'array', items: object(insightProperties, ['title', 'explanation', 'evidence']) },
  improvements: { type: 'array', items: object(insightProperties) },
  recommendations: stringList
});

export const resumeInformationSchema = object({
  information: object(informationProperties)
});

export const jobAnalysisSchema = object({
  summary: { type: 'string' },
  skills: stringList,
  keywords: stringList,
  responsibilities: stringList,
  requirements: {
    type: 'array',
    items: object({
      text: { type: 'string' },
      required: { type: 'boolean' },
      category: { type: 'string', enum: ['skill', 'experience', 'education', 'certification', 'language', 'other'] }
    })
  },
  experienceRequirements: nullableString,
  educationRequirements: nullableString,
  languageRequirements: stringList,
  sourceEvidence: stringList
});

export const matchAnalysisSchema = object({
  categories: object({
    skills: object(categoryProperties, ['score', 'explanation', 'evidence']),
    experience: object(categoryProperties, ['score', 'explanation', 'evidence']),
    education: object(categoryProperties, ['score', 'explanation', 'evidence']),
    keywords: object(categoryProperties, ['score', 'explanation', 'evidence']),
    impact: object(categoryProperties, ['score', 'explanation', 'evidence']),
    completeness: object(categoryProperties, ['score', 'explanation', 'evidence'])
  }),
  matchedSkills: stringList,
  missingSkills: stringList,
  additionalSkills: stringList,
  gaps: {
    type: 'array',
    items: object({
      item: { type: 'string' },
      importance: { type: 'string', enum: ['required', 'preferred'] },
      explanation: { type: 'string' }
    })
  },
  explanation: { type: 'string' },
  recommendation: { type: 'string' }
});

export const recommendationsSchema = object({
  recommendations: requiredStringList,
  priorityActions: {
    type: 'array',
    minItems: 1,
    items: object({
      action: { type: 'string' },
      rationale: { type: 'string' },
      evidence: stringList
    })
  }
});

export const resumeImprovementSchema = object({
  revisions: {
    type: 'array',
    minItems: 1,
    items: object({
      section: { type: 'string' },
      original: { type: 'string' },
      revised: { type: 'string' },
      rationale: { type: 'string' },
      sourceEvidence: requiredStringList
    })
  },
  suggestions: stringList
});
