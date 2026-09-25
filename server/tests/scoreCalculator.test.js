import { describe, expect, it } from 'vitest';
import {
  buildMissingInformation,
  calculateMatchOverall,
  calculateResumeScore,
  MATCH_SCORE_WEIGHTS,
  RESUME_SCORE_WEIGHTS
} from '../utils/scoreCalculator.js';

const completeResume = `Example Candidate
candidate@example.com
+1 555 123 4567
Example City
https://github.com/example

SUMMARY
Software engineer with experience building reliable web platforms and accessible data tools for regulated and consumer products.

SKILLS
JavaScript, Node.js, React, MongoDB, Express, PostgreSQL, Docker, AWS, TypeScript, Testing

EXPERIENCE
Senior Engineer, Example Labs, 2021 - 2025
Led a team that improved deployment reliability by 35% and reduced processing time by 20% across 12 services.

EDUCATION
Bachelor of Science in Computer Science, Example University, 2019

PROJECTS
Open Source Dashboard
Built an accessible dashboard used by 1200 monthly users and documented the release process.`;

const information = {
  name: 'Example Candidate',
  email: 'candidate@example.com',
  phone: '+1 555 123 4567',
  location: 'Example City',
  links: ['https://github.com/example'],
  skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Express', 'PostgreSQL', 'Docker', 'AWS', 'TypeScript', 'Testing'],
  experience: [{ role: 'Senior Engineer', company: 'Example Labs', startDate: '2021', endDate: '2025', description: 'Led reliability and performance improvements.' }],
  education: [{ degree: 'Bachelor of Science', field: 'Computer Science', institution: 'Example University', year: '2019' }],
  projects: [{ name: 'Open Source Dashboard', description: 'Built an accessible dashboard used by 1200 monthly users.' }]
};

describe('deterministic score calculator', () => {
  it('uses weights totaling exactly 100', () => {
    expect(Object.values(RESUME_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(Object.values(MATCH_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('returns stable explainable results', () => {
    const first = calculateResumeScore({ text: completeResume, information });
    const second = calculateResumeScore({ text: completeResume, information });
    expect(first).toEqual(second);
    expect(first.overall.score).toBeGreaterThan(50);
    expect(first.categories.contactInformation.weight).toBe(10);
    expect(first.categories.experience.weight).toBe(25);
    expect(first.disclaimer).toContain('does not guarantee employment');
  });

  it('scores a sparse document below a complete document', () => {
    const sparse = calculateResumeScore({ text: 'Candidate', information: {} });
    const complete = calculateResumeScore({ text: completeResume, information });
    expect(sparse.overall.score).toBeLessThan(complete.overall.score);
  });

  it('calculates the required match weights deterministically', () => {
    const scores = calculateMatchOverall({
      skills: 100,
      experience: 80,
      education: 0,
      keywords: 0,
      impact: 0,
      completeness: 0
    });
    expect(scores.overall).toBe(60);
    expect(scores.categories.skills.weight).toBe(40);
    expect(scores.categories.experience.weight).toBe(25);
    expect(scores.disclaimer).toContain('does not guarantee');
  });
});

describe('buildMissingInformation', () => {
  it('returns nothing for a complete document with evidence everywhere', () => {
    const scores = calculateResumeScore({ text: completeResume, information });
    expect(buildMissingInformation(scores)).toEqual([]);
  });

  it('reports only the categories that actually lack evidence', () => {
    const sparseInformation = { ...information, education: [], projects: [] };
    const scores = calculateResumeScore({ text: completeResume, information: sparseInformation });
    const missing = buildMissingInformation(scores);
    expect(missing).toHaveLength(2);
    expect(missing.join(' ')).toContain('Add your degree');
    expect(missing.join(' ')).toContain('Add at least one project');
    expect(missing.join(' ')).not.toContain('contact block');
  });

  it('reports every category that has no supporting evidence', () => {
    const scores = calculateResumeScore({ text: 'Candidate', information: {} });
    const missing = buildMissingInformation(scores);
    expect(missing).toHaveLength(8);
    for (const message of missing) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(10);
    }
  });

  it('is deterministic and safe for missing or empty scores', () => {
    const scores = calculateResumeScore({ text: 'Candidate', information: {} });
    expect(buildMissingInformation(scores)).toEqual(buildMissingInformation(scores));
    expect(buildMissingInformation({})).toEqual([]);
    expect(buildMissingInformation(null)).toEqual([]);
    expect(buildMissingInformation({ categories: new Map() })).toEqual([]);
  });

  it('does not mistake a year range for a phone number', () => {
    const text = 'Example Candidate\nExample City\n\nEXPERIENCE\nEngineer, Example Labs, 2021 - 2025\nShipped work.';
    const scores = calculateResumeScore({ text, information: {} });
    expect(scores.categories.contactInformation.score).toBe(0);
    expect(scores.categories.contactInformation.evidence).toEqual([]);
    expect(buildMissingInformation(scores).join(' ')).toContain('contact block');
  });
});
