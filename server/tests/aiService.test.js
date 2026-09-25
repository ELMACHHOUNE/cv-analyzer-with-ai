import { describe, expect, it, vi } from 'vitest';
import { analyzeResume, requestXaiJson } from '../services/aiService.js';

const responsesEndpoint = 'https://api.x.ai/v1/responses';

const testConfig = {
  apiKey: null,
  model: 'test-model',
  timeoutMs: 1000,
  endpoint: responsesEndpoint
};

function jsonResponse(payload, overrides = {}) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(payload),
    ...overrides
  };
}

function outputPayload(text) {
  return {
    status: 'completed',
    output: [
      { type: 'reasoning', content: [] },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }
    ]
  };
}

function configured(overrides = {}) {
  return { ...testConfig, apiKey: 'test-placeholder', ...overrides };
}

describe('AI service safety', () => {
  it('fails safely without making a request when the key is missing', async () => {
    const fetchImpl = vi.fn();
    await expect(analyzeResume('Candidate resume text', { config: testConfig, fetchImpl })).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_NOT_CONFIGURED'
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed model JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(outputPayload('{malformed')));
    await expect(requestXaiJson({
      systemPrompt: 'Return JSON only.',
      userPrompt: 'Return an object.',
      schemaName: 'unit_test',
      schema: { type: 'object' }
    }, { config: configured(), fetchImpl })).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE'
    });
  });

  it('uses the Responses endpoint with documented fields only', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(outputPayload('{"ok":true}')));
    await requestXaiJson({
      systemPrompt: 'Return JSON only.',
      userPrompt: 'Return an object.',
      schemaName: 'unit_test',
      schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
    }, { config: configured(), fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(responsesEndpoint);
    expect(fetchImpl.mock.calls[0][1].method).toBe('POST');

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.model).toBe('test-model');
    expect(body.input[0]).toEqual({ role: 'system', content: 'Return JSON only.' });
    expect(body.input[1]).toEqual({ role: 'user', content: 'Return an object.' });
    expect(body.store).toBe(false);
    expect(body.max_output_tokens).toBe(6000);
    expect(body.text.format.type).toBe('json_schema');
    expect(body.text.format.json_schema.name).toBe('unit_test');
    expect(body.text.format.json_schema.strict).toBe(false);
    expect(body.text.format.json_schema.schema).toEqual({ type: 'object', properties: { ok: { type: 'boolean' } } });
    expect(body.messages).toBeUndefined();
    expect(body.response_format).toBeUndefined();
    expect(body.temperature).toBeUndefined();
    expect(body.max_tokens).toBeUndefined();
    expect(body.stream).toBeUndefined();
  });

  it('joins every output_text part across message items', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      output: [
        { type: 'message', content: [{ type: 'output_text', text: '{"a":' }] },
        { type: 'message', content: [{ type: 'output_text', text: '1}' }] }
      ]
    }));
    const result = await requestXaiJson({ systemPrompt: 's', userPrompt: 'u' }, {
      config: configured(),
      fetchImpl
    });
    expect(result.data).toEqual({ a: 1 });
  });

  it('retries once without text.format after a 400 and still parses the payload', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'unsupported text.format' }, { ok: false, status: 400 }))
      .mockResolvedValueOnce(jsonResponse(outputPayload('{"ok":true}')));

    const result = await requestXaiJson({
      systemPrompt: 'Return JSON only.',
      userPrompt: 'Return an object.',
      schemaName: 'unit_test',
      schema: { type: 'object' }
    }, { config: configured(), fetchImpl });

    expect(result.data).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const first = JSON.parse(fetchImpl.mock.calls[0][1].body);
    const second = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(first.text).toBeDefined();
    expect(second.text).toBeUndefined();
    expect(second.store).toBe(false);
    expect(second.input[0].role).toBe('system');
  });

  it('does not retry more than once for repeated 400 responses', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'bad request' }, { ok: false, status: 400 }));
    await expect(requestXaiJson({
      systemPrompt: 's',
      userPrompt: 'u',
      schemaName: 'unit_test',
      schema: { type: 'object' }
    }, { config: configured(), fetchImpl })).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_UNAVAILABLE'
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('treats an incomplete response as an invalid AI response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output: []
    }));
    await expect(requestXaiJson({ systemPrompt: 's', userPrompt: 'u' }, {
      config: configured(),
      fetchImpl
    })).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE'
    });
  });

  it('treats a refusal part as an invalid AI response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'I cannot help with that.' }] }]
    }));
    await expect(requestXaiJson({ systemPrompt: 's', userPrompt: 'u' }, {
      config: configured(),
      fetchImpl
    })).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE'
    });
  });

  it('sends the resume analysis schema on a structured analysis request', async () => {
    const source = [
      'John Smith',
      'john@example.com',
      'Summary: Backend engineer focused on reliable APIs.',
      'Skills: Node.js, MongoDB',
      'Leadership and teamwork across three teams.'
    ].join('\n');
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(outputPayload(JSON.stringify({
      information: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: null,
        location: null,
        links: [],
        skills: ['Node.js', 'Leadership'],
        technicalSkills: ['Node.js'],
        softSkills: ['Leadership'],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: [],
        achievements: []
      },
      summary: 'Backend engineer focused on reliable APIs.',
      strengths: [{ title: 'Node.js depth', explanation: 'Uses Node.js in production.', evidence: ['Node.js'] }],
      improvements: [],
      recommendations: ['Add more detail']
    }))));

    const result = await analyzeResume(source, { config: configured(), fetchImpl });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.text.format.json_schema.name).toBe('resume_analysis');
    expect(body.text.format.json_schema.schema.properties.information.properties.technicalSkills)
      .toEqual({ type: 'array', items: { type: 'string' } });
    expect(result.information.technicalSkills).toEqual(['Node.js']);
    expect(result.information.softSkills).toEqual(['Leadership']);
    expect(result.information.technologies).toEqual(['Node.js']);
    expect(result.information.skills).toEqual(['Node.js', 'Leadership']);
  });
});
