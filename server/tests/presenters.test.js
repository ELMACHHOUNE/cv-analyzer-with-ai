import { describe, expect, it } from 'vitest';
import {
  presentAnalysis,
  presentJob,
  presentMatch,
  presentResume,
  presentUser
} from '../utils/presenters.js';
import { calculateMatchOverall, calculateResumeScore } from '../utils/scoreCalculator.js';

const resumeText = [
  'SUMMARY',
  'Backend engineer with experience building reliable web platforms and accessible data tools.',
  '',
  'SKILLS',
  'Node.js, MongoDB, Express, Leadership',
  '',
  'EXPERIENCE',
  'Senior Engineer, Example Labs, 2021 - 2025',
  'Led a team that improved deployment reliability by 35%.',
  '',
  'EDUCATION',
  'Bachelor of Science in Computer Science, Example University, 2019',
  '',
  'PROJECTS',
  'Open Source Dashboard',
  'Built an accessible dashboard used by 1200 monthly users.'
].join('\n');

const information = {
  name: 'Example Candidate',
  email: 'candidate@example.com',
  phone: null,
  location: 'Example City',
  links: ['https://github.com/example'],
  skills: ['Node.js', 'Leadership'],
  technicalSkills: ['Node.js'],
  softSkills: ['Leadership'],
  experience: [{ role: 'Senior Engineer', company: 'Example Labs', startDate: '2021', endDate: '2025', description: 'Led reliability improvements.\nReduced processing time by 20%.' }],
  education: [{ degree: 'Bachelor of Science', field: 'Computer Science', institution: 'Example University', year: '2019' }],
  projects: [{ name: 'Open Source Dashboard', description: 'Built an accessible dashboard.' }],
  certifications: [],
  languages: [],
  achievements: []
};

function analysisFixture(overrides = {}) {
  return {
    _id: 'analysis-1',
    name: 'Example analysis',
    summary: 'A strong backend profile.',
    information,
    scores: calculateResumeScore({ text: resumeText, information }),
    strengths: [{ title: 'Reliability work', explanation: 'Improved reliability by 35%.', evidence: ['35%'] }],
    improvements: [{ title: 'Add metrics', explanation: 'Some bullets lack numbers.', evidence: [], priority: 'medium' }],
    recommendations: ['Quantify more outcomes'],
    model: 'openai/gpt-oss-120b',
    promptVersion: 'v1',
    disclaimer: 'Educational estimate only.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides
  };
}

describe('presentAnalysis', () => {
  it('adds the spec score aliases without removing native fields', () => {
    const presented = presentAnalysis(analysisFixture(), { resumeName: 'My CV' });
    expect(presented.score).toBe(presented.scores.overall.score);
    expect(presented.label).toBe(presented.scores.overall.label);
    expect(presented.scoreFormula).toBe(presented.scores.overall.formula);
    expect(presented.scoreDisclaimer).toContain('does not guarantee employment');
    expect(presented._id).toBe('analysis-1');
    expect(presented.scores.categories.skills).toBeDefined();
    expect(presented.resumeName).toBe('My CV');
    expect(presented.disclaimer).toBe('Educational estimate only.');
    expect(presented.promptVersion).toBe('v1');
    expect(presented.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(presented.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('exposes scoreBreakdown and categories as arrays of the same entries', () => {
    const presented = presentAnalysis(analysisFixture());
    expect(Array.isArray(presented.scoreBreakdown)).toBe(true);
    expect(presented.categories).toEqual(presented.scoreBreakdown);
    for (const entry of presented.scoreBreakdown) {
      expect(Object.keys(entry).sort()).toEqual(
        ['evidence', 'explanation', 'key', 'label', 'score', 'weight', 'weightedPoints'].sort()
      );
    }
    expect(presented.scoreBreakdown.map((entry) => entry.key)).toContain('contactInformation');
  });

  it('builds a profile and skill aliases from the stored information', () => {
    const presented = presentAnalysis(analysisFixture());
    expect(presented.profile).toEqual({
      fullName: 'Example Candidate',
      name: 'Example Candidate',
      email: 'candidate@example.com',
      phone: null,
      location: 'Example City',
      summary: 'A strong backend profile.',
      links: ['https://github.com/example']
    });
    expect(presented.technicalSkills).toEqual(['Node.js']);
    expect(presented.softSkills).toEqual(['Leadership']);
    expect(presented.technologies).toEqual(['Node.js']);
    expect(presented.skills).toEqual(['Node.js', 'Leadership']);
  });

  it('falls back from role to title and keeps a missing location null', () => {
    const presented = presentAnalysis(analysisFixture());
    const [entry] = presented.experience;
    expect(entry.title).toBe('Senior Engineer');
    expect(entry.role).toBe('Senior Engineer');
    expect(entry.company).toBe('Example Labs');
    expect(entry.location).toBeNull();
    expect(entry.highlights).toEqual(['Led reliability improvements.', 'Reduced processing time by 20%.']);
    expect(presented.education[0]).toEqual({
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      institution: 'Example University',
      startDate: null,
      endDate: null,
      year: '2019',
      description: null
    });
    expect(presented.projects[0]).toEqual({
      name: 'Open Source Dashboard',
      title: 'Open Source Dashboard',
      role: null,
      description: 'Built an accessible dashboard.',
      technologies: [],
      skills: [],
      url: null,
      startDate: null,
      endDate: null
    });
  });

  it('aliases improvements as weaknesses and summarises the explanation', () => {
    const presented = presentAnalysis(analysisFixture());
    expect(presented.weaknesses).toEqual(presented.improvements);
    expect(presented.strengths).toEqual(analysisFixture().strengths);
    expect(presented.explanation.strongPoints).toEqual(['Improved reliability by 35%.']);
    expect(presented.explanation.areasToImprove).toEqual(['Some bullets lack numbers.']);
    expect(presented.explanation.formula).toBe(presented.scoreFormula);
    expect(presented.explanation.disclaimer).toBe(presented.scoreDisclaimer);
  });

  it('derives missingInformation from categories without evidence', () => {
    const sparse = presentAnalysis(analysisFixture({
      information: { ...information, projects: [], education: [] },
      scores: calculateResumeScore({ text: 'Candidate', information: {} })
    }));
    expect(Array.isArray(sparse.missingInformation)).toBe(true);
    expect(sparse.missingInformation).toHaveLength(8);
    expect(sparse.missingInformation.join(' ')).toContain('Add your degree, field of study, institution');
    expect(sparse.missingInformation.join(' ')).toContain('Add at least one project');
  });

  it('reads categories supplied as a Map', () => {
    const scores = calculateResumeScore({ text: resumeText, information });
    scores.categories = new Map(Object.entries(scores.categories));
    const presented = presentAnalysis(analysisFixture({ scores }));
    expect(presented.scoreBreakdown.length).toBeGreaterThan(0);
    expect(presented.scores.categories.skills).toBeDefined();
  });
});

describe('presentMatch', () => {
  function matchFixture(overrides = {}) {
    const calculated = calculateMatchOverall({
      skills: 80,
      experience: 60,
      education: 40,
      keywords: 20,
      impact: 50,
      completeness: 100
    });
    calculated.categories.skills.explanation = 'Node.js matches the role.';
    calculated.categories.skills.evidence = ['Node.js'];
    calculated.categories.experience.explanation = 'Six years of backend work.';
    calculated.categories.experience.evidence = ['Senior Engineer'];
    calculated.categories.education.explanation = 'Degree is relevant.';
    calculated.categories.education.evidence = ['Bachelor of Science'];
    calculated.categories.keywords.explanation = 'Some keywords match.';
    calculated.categories.keywords.evidence = ['reliable'];
    return {
      _id: 'match-1',
      scores: calculated,
      matchedSkills: ['Node.js'],
      missingSkills: ['Kubernetes'],
      additionalSkills: ['MongoDB'],
      gaps: [
        { item: 'Kubernetes', importance: 'required', explanation: 'Kubernetes is required by the role.' },
        { item: 'GraphQL', importance: 'preferred', explanation: 'GraphQL is a nice to have.' }
      ],
      explanation: 'Good overlap on backend skills.',
      recommendation: 'Add Kubernetes experience.',
      createdAt: '2026-01-03T00:00:00.000Z',
      resume: { name: 'My CV', originalName: 'cv.pdf' },
      job: { title: 'Backend Engineer', company: 'Example Labs', location: 'Remote', url: 'https://example.com/job' },
      ...overrides
    };
  }

  it('adds the spec match aliases without removing native fields', () => {
    const match = matchFixture();
    const presented = presentMatch(match);
    expect(presented.score).toBe(match.scores.overall);
    expect(presented.label).toBe(match.scores.label);
    expect(presented.matchingSkills).toEqual(['Node.js']);
    expect(presented.matchedSkills).toEqual(['Node.js']);
    expect(presented.missingSkills).toEqual(['Kubernetes']);
    expect(presented.additionalSkills).toEqual(['MongoDB']);
    expect(presented.explanation).toBe('Good overlap on backend skills.');
    expect(presented.disclaimer).toContain('does not guarantee');
    expect(presented.createdAt).toBe('2026-01-03T00:00:00.000Z');
    expect(presented.gaps).toEqual(match.gaps);
  });

  it('exposes scoreBreakdown and categoryScores for the six match categories', () => {
    const presented = presentMatch(matchFixture());
    expect(Object.keys(presented.categoryScores)).toEqual([
      'skills', 'experience', 'education', 'keywords', 'impact', 'completeness'
    ]);
    expect(presented.categoryScores.skills).toBe(80);
    expect(presented.scoreBreakdown).toHaveLength(6);
    expect(presented.scoreBreakdown[0].key).toBe('skills');
    expect(presented.scoreBreakdown[0].explanation).toBe('Node.js matches the role.');
  });

  it('derives experience, education, keyword and gap aliases from grounded evidence', () => {
    const presented = presentMatch(matchFixture());
    expect(presented.matchingExperience).toEqual([
      { item: 'Senior Engineer', explanation: 'Six years of backend work.' }
    ]);
    expect(presented.missingExperience).toEqual([
      { item: 'Kubernetes', importance: 'required', explanation: 'Kubernetes is required by the role.' }
    ]);
    expect(presented.educationCompatibility).toEqual({
      score: 40,
      label: 'Limited evidence',
      explanation: 'Degree is relevant.',
      evidence: ['Bachelor of Science']
    });
    expect(presented.keywordMatches).toEqual(['reliable']);
    expect(presented.strongMatches).toEqual(['Node.js']);
  });

  it('builds recommendations from the recommendation and every gap explanation', () => {
    const presented = presentMatch(matchFixture());
    expect(presented.recommendations).toEqual([
      'Add Kubernetes experience.',
      'Kubernetes is required by the role.',
      'GraphQL is a nice to have.'
    ]);
  });

  it('presents the populated resume and job with the fields the client links to', () => {
    const presented = presentMatch(matchFixture());
    expect(presented.resume.name).toBe('My CV');
    expect(presented.resume.originalName).toBe('cv.pdf');
    expect(presented.resume.fileName).toBe('cv.pdf');
    expect(presented.job.title).toBe('Backend Engineer');
    expect(presented.job.company).toBe('Example Labs');
    expect(presented.job.location).toBe('Remote');
    expect(presented.job.url).toBe('https://example.com/job');
  });
});

describe('presentResume', () => {
  const resume = {
    _id: 'resume-1',
    name: 'My CV',
    originalName: 'Ada Lovelace CV.pdf',
    storageName: 'f3a1.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    status: 'ready',
    extractedText: 'private text',
    textHash: 'hash-value',
    extractionMethod: 'pdf-text',
    wordCount: 120,
    characterCount: 800,
    pageCount: 2,
    analysisCount: 3,
    lastAnalyzedAt: '2026-01-04T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-04T00:00:00.000Z'
  };

  it('maps stored status ready to the spec vocabulary and adds file aliases', () => {
    const presented = presentResume(resume);
    expect(presented.status).toBe('processed');
    expect(presented.fileName).toBe('Ada Lovelace CV.pdf');
    expect(presented.fileType).toBe('application/pdf');
    expect(presented.fileSize).toBe(2048);
    expect(presented.size).toBe(2048);
    expect(presented.extractionMethod).toBe('pdf-text');
    expect(presented.wordCount).toBe(120);
    expect(presented.characterCount).toBe(800);
    expect(presented.pageCount).toBe(2);
    expect(presented.analysisCount).toBe(3);
    expect(presented.lastAnalyzedAt).toBe('2026-01-04T00:00:00.000Z');
  });

  it('never exposes stored text, storage names or hashes', () => {
    const presented = presentResume(resume);
    expect(presented.storageName).toBeUndefined();
    expect(presented.extractedText).toBeUndefined();
    expect(presented.textHash).toBeUndefined();
  });

  it('presents the latest analysis reference or null', () => {
    const withAnalysis = presentResume(resume, {
      analysis: { _id: 'analysis-9', scores: { overall: { score: 82, label: 'Strong foundation' } }, createdAt: '2026-01-04T00:00:00.000Z' }
    });
    expect(withAnalysis.analysis).toEqual({
      _id: 'analysis-9',
      score: 82,
      label: 'Strong foundation',
      createdAt: '2026-01-04T00:00:00.000Z'
    });
    expect(presentResume(resume).analysis).toBeNull();
  });

  it('passes through the other spec status values', () => {
    expect(presentResume({ ...resume, status: 'failed' }).status).toBe('failed');
    expect(presentResume({ ...resume, status: 'uploaded' }).status).toBe('uploaded');
    expect(presentResume({ ...resume, status: 'processing' }).status).toBe('processing');
  });
});

describe('presentJob and presentUser', () => {
  it('prefers analysed skills and keywords and reports the match count', () => {
    const job = {
      _id: 'job-1',
      title: 'Backend Engineer',
      company: 'Example Labs',
      location: 'Remote',
      url: 'https://example.com/job',
      skills: ['Node.js'],
      descriptionHash: 'hash-value',
      jobAnalysis: { skills: ['Node.js', 'MongoDB'], keywords: ['api', 'scale'] }
    };
    const presented = presentJob(job, { matchCount: 4 });
    expect(presented.skills).toEqual(['Node.js', 'MongoDB']);
    expect(presented.keywords).toEqual(['api', 'scale']);
    expect(presented.matchCount).toBe(4);
    expect(presented.descriptionHash).toBeUndefined();
    expect(presented.title).toBe('Backend Engineer');
    expect(presented.company).toBe('Example Labs');
    expect(presented.location).toBe('Remote');
    expect(presented.url).toBe('https://example.com/job');
  });

  it('falls back to user-provided skills when no job analysis exists', () => {
    const presented = presentJob({ title: 'Backend Engineer', skills: ['Node.js'] });
    expect(presented.skills).toEqual(['Node.js']);
    expect(presented.keywords).toEqual([]);
    expect(presented.matchCount).toBe(0);
  });

  it('never exposes the password hash', () => {
    const presented = presentUser({
      _id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: 'secret-hash',
      settings: { targetRole: 'Backend', preferredLanguage: 'en', theme: 'dark' }
    });
    expect(presented.passwordHash).toBeUndefined();
    expect(presented.settings).toEqual({ targetRole: 'Backend', preferredLanguage: 'en', theme: 'dark' });
    expect(presented.email).toBe('ada@example.com');
  });
});
