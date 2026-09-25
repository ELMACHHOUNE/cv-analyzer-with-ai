import { describe, expect, it, vi } from 'vitest';
import { analyzeResume, requestProviderJson } from '../services/aiService.js';

const responsesEndpoint = 'https://api.x.ai/v1/responses';
const chatEndpoint = 'https://api.groq.com/openai/v1/chat/completions';

const testConfig = {
  provider: 'xai',
  apiStyle: 'responses',
  apiKey: null,
  model: 'test-model',
  timeoutMs: 1000,
  endpoint: responsesEndpoint
};

const chatConfig = {
  provider: 'groq',
  apiStyle: 'chat',
  apiKey: 'test-placeholder',
  model: 'test-model',
  timeoutMs: 1000,
  endpoint: chatEndpoint
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

function chatPayload(content, overrides = {}) {
  return {
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
    ...overrides
  };
}

function configured(overrides = {}) {
  return { ...testConfig, apiKey: 'test-placeholder', ...overrides };
}

function failureResponse(status, body) {
  return {
    ok: false,
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(body))
  };
}

function runAgainst(failure) {
  return requestProviderJson({
    systemPrompt: 'Return JSON only.',
    userPrompt: 'Return an object.',
    schemaName: 'unit_test',
    schema: { type: 'object' }
  }, { config: configured(), fetchImpl: vi.fn().mockResolvedValue(failure) });
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

  it('reports an exhausted provider credit balance instead of a bare 502', async () => {
    await expect(runAgainst(failureResponse(403, {
      code: 'permission-denied',
      error: 'Your team has either used all available credits or reached its monthly spending limit.'
    }))).rejects.toMatchObject({ statusCode: 502, code: 'AI_CREDITS_EXHAUSTED' });
  });

  it('separates a rejected key, an unknown model, and a rate limit', async () => {
    await expect(runAgainst(failureResponse(401, { code: 'unauthenticated' }))).rejects.toMatchObject({ code: 'AI_ACCESS_DENIED' });
    await expect(runAgainst(failureResponse(404, { code: 'model_not_found' }))).rejects.toMatchObject({ code: 'AI_MODEL_NOT_FOUND' });
    await expect(runAgainst(failureResponse(429, { code: 'rate_limit' }))).rejects.toMatchObject({ statusCode: 503, code: 'AI_RATE_LIMITED' });
    await expect(runAgainst(failureResponse(503, { code: 'server_error' }))).rejects.toMatchObject({ statusCode: 502, code: 'AI_UNAVAILABLE' });
  });

  it('rejects malformed model JSON', async () => {    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(outputPayload('{malformed')));
    await expect(requestProviderJson({
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
    await requestProviderJson({
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
    expect(body.text.format.name).toBe('unit_test');
    expect(body.text.format.strict).toBe(false);
    expect(body.text.format.schema).toEqual({ type: 'object', properties: { ok: { type: 'boolean' } } });
    expect(body.text.format.json_schema).toBeUndefined();
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
    const result = await requestProviderJson({ systemPrompt: 's', userPrompt: 'u' }, {
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

    const result = await requestProviderJson({
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
    await expect(requestProviderJson({
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
    await expect(requestProviderJson({ systemPrompt: 's', userPrompt: 'u' }, {
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
    await expect(requestProviderJson({ systemPrompt: 's', userPrompt: 'u' }, {
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
    expect(body.text.format.name).toBe('resume_analysis');
    expect(body.text.format.schema.properties.information.properties.technicalSkills)
      .toEqual({ type: 'array', items: { type: 'string' } });
    expect(result.information.technicalSkills).toEqual(['Node.js']);
    expect(result.information.softSkills).toEqual(['Leadership']);
    expect(result.information.technologies).toEqual(['Node.js']);
    expect(result.information.skills).toEqual(['Node.js', 'Leadership']);
  });
});

describe('Groq chat completions provider', () => {
  it('sends only fields the provider documents', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(chatPayload('{"ok":true}')));
    await requestProviderJson({
      systemPrompt: 'Return JSON only.',
      userPrompt: 'Return an object.',
      schemaName: 'unit_test',
      schema: { type: 'object', properties: { ok: { type: 'boolean' } } }
    }, { config: chatConfig, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(chatEndpoint);

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.model).toBe('test-model');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'Return JSON only.' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Return an object.' });
    expect(body.max_completion_tokens).toBe(6000);
    expect(body.temperature).toBe(0);
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema.name).toBe('unit_test');
    expect(body.response_format.json_schema.strict).toBe(false);
    expect(body.response_format.json_schema.schema).toEqual({ type: 'object', properties: { ok: { type: 'boolean' } } });
    expect(body.store).toBeUndefined();
    expect(body.stream).toBeUndefined();
    expect(body.max_tokens).toBeUndefined();
    expect(body.input).toBeUndefined();
    expect(body.text).toBeUndefined();
  });

  it('reads the assistant message content', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(chatPayload('{"a":1}')));
    const result = await requestProviderJson({ systemPrompt: 's', userPrompt: 'u' }, {
      config: chatConfig,
      fetchImpl
    });
    expect(result.data).toEqual({ a: 1 });
    expect(result.provider).toBe('groq');
  });

  it('reports a token-truncated answer as an invalid response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      choices: [{ finish_reason: 'length', message: { content: '{"summary":"Backend eng' } }]
    }));
    await expect(requestProviderJson({ systemPrompt: 's', userPrompt: 'u' }, {
      config: chatConfig,
      fetchImpl
    })).rejects.toMatchObject({ statusCode: 502, code: 'AI_INVALID_RESPONSE' });
  });

  it('treats a refusal as an invalid response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      choices: [{ finish_reason: 'stop', message: { content: null, refusal: 'I cannot help with that.' } }]
    }));
    await expect(requestProviderJson({ systemPrompt: 's', userPrompt: 'u' }, {
      config: chatConfig,
      fetchImpl
    })).rejects.toMatchObject({ statusCode: 502, code: 'AI_INVALID_RESPONSE' });
  });

  it('falls back to json_object mode after a schema 400', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'json_schema is not supported' } }, { ok: false, status: 400 }))
      .mockResolvedValueOnce(jsonResponse(chatPayload('{"ok":true}')));

    const result = await requestProviderJson({
      systemPrompt: 'Return JSON only.',
      userPrompt: 'Return an object.',
      schemaName: 'unit_test',
      schema: { type: 'object' }
    }, { config: chatConfig, fetchImpl });

    expect(result.data).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const second = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(second.response_format).toEqual({ type: 'json_object' });
    expect(second.model).toBe('test-model');
  });

  it('sends the resume analysis schema over chat completions', async () => {
    const source = [
      'John Smith',
      'john@example.com',
      'Summary: Backend engineer focused on reliable APIs.',
      'Skills: Node.js, MongoDB',
      'Leadership and teamwork across three teams.'
    ].join('\n');
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(chatPayload(JSON.stringify({
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

    const result = await analyzeResume(source, { config: chatConfig, fetchImpl });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.response_format.json_schema.name).toBe('resume_analysis');
    expect(body.response_format.json_schema.schema.properties.information.properties.technicalSkills)
      .toEqual({ type: 'array', items: { type: 'string' } });
    expect(result.information.technicalSkills).toEqual(['Node.js']);
    expect(result.information.softSkills).toEqual(['Leadership']);
    expect(result.model).toBe('test-model');
  });
});
