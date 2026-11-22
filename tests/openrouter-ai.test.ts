import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOpenRouterConfig,
  buildSystemPrompt,
  checkAiRateLimit,
  askOpenRouter,
  analyzeDocumentWithOpenRouter,
} from '../server/openRouterAdapter.mjs';

describe('OpenRouter AI Adapter Integration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('Configuration & Security', () => {
    it('never exposes API keys in getOpenRouterConfig', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-secret-token-12345';
      process.env.OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct';
      process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

      const config = getOpenRouterConfig();

      expect(config.isConfigured).toBe(true);
      expect(config.model).toBe('meta-llama/llama-3.3-70b-instruct');
      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
      // Must not leak the actual secret token in the returned config object
      expect((config as any).apiKey).toBeUndefined();
    });

    it('reports isConfigured as false when OPENROUTER_API_KEY is empty', () => {
      delete process.env.OPENROUTER_API_KEY;
      const config = getOpenRouterConfig();
      expect(config.isConfigured).toBe(false);
    });
  });

  describe('System Prompt & Multilingual Support', () => {
    it('generates English system prompt with strict anti-hallucination rules', () => {
      const prompt = buildSystemPrompt('en');
      expect(prompt).toContain('Ask Dharitri');
      expect(prompt).toContain('Reply in clear, professional English');
      expect(prompt).toContain('NEVER invent or guess Jamabandi, Patta, Dag numbers');
      expect(prompt).toContain('NEVER certify legal title');
    });

    it('generates Assamese system prompt with proper Unicode rendering', () => {
      const prompt = buildSystemPrompt('as');
      expect(prompt).toContain('Reply exclusively in formal Assamese (অসমীয়া Unicode)');
      expect(prompt).toContain('Ask Dharitri');
      expect(prompt).toContain('Assam');
    });

    it('generates Hindi system prompt with proper Hindi rendering', () => {
      const prompt = buildSystemPrompt('hi');
      expect(prompt).toContain('Reply exclusively in clear, professional Hindi (हिन्दी)');
      expect(prompt).toContain('Ask Dharitri');
    });
  });

  describe('Rate Limiting & Abuse Prevention', () => {
    it('permits requests within rate limit and throttles excess requests', () => {
      const testIp = '192.168.1.100';
      for (let i = 0; i < 15; i++) {
        const check = checkAiRateLimit(testIp, 15);
        expect(check.allowed).toBe(true);
      }
      // 16th request must be rejected
      const blocked = checkAiRateLimit(testIp, 15);
      expect(blocked.allowed).toBe(false);
    });
  });

  describe('Safe Fallback Behavior (Offline or Unconfigured)', () => {
    it('returns structured, non-hallucinated guidance when API key is missing', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const res = await askOpenRouter({
        message: 'What is a Jamabandi record in Assam?',
        language: 'en',
      });

      expect(res.isFallback).toBe(true);
      expect(res.model).toBe('dharitri-safe-knowledge-fallback');
      expect(res.answer).toContain('Record of Rights');
      expect(res.answer).toContain('Revenue Department');
      expect(res.sourceStatus).toContain('Dharitri Sentu local Assam land knowledge rules');
    });

    it('returns Assamese fallback with proper Unicode when language is as', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const res = await askOpenRouter({
        message: 'জমাৱন্দী কি?',
        language: 'as',
      });

      expect(res.isFallback).toBe(true);
      expect(res.language).toBe('as');
      expect(res.answer).toContain('জমাৱন্দী');
      expect(res.answer).toContain('ৰাজহ বিভাগ');
    });
  });

  describe('OpenRouter API Call Handling', () => {
    it('dispatches OpenAI-compatible chat completion payload when configured', async () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-key-mocked';
      process.env.OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'meta-llama/llama-3.3-70b-instruct',
          choices: [
            {
              message: {
                content: 'In Assam, a Periodic Patta (Myadi Patta) establishes permanent ownership.',
              },
            },
          ],
        }),
      });

      global.fetch = mockFetch as any;

      const res = await askOpenRouter({
        message: 'Explain Periodic Patta',
        language: 'en',
        context: 'LandLocker Page',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer sk-or-v1-test-key-mocked');
      expect(options.headers['HTTP-Referer']).toBe('https://dharitrisentu.assam.gov.in.demo');

      const body = JSON.parse(options.body);
      expect(body.model).toBe('meta-llama/llama-3.3-70b-instruct');
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toContain('User Question: Explain Periodic Patta');

      expect(res.answer).toBe('In Assam, a Periodic Patta (Myadi Patta) establishes permanent ownership.');
      expect(res.isFallback).toBe(false);
    });

    it('handles 401 Unauthorized errors from OpenRouter gracefully without leaking keys', async () => {
      process.env.OPENROUTER_API_KEY = 'invalid-key';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      }) as any;

      await expect(
        askOpenRouter({
          message: 'Hello',
          language: 'en',
        })
      ).rejects.toThrow('OpenRouter authentication failed. Please verify the server OPENROUTER_API_KEY.');
    });

    it('handles 429 Rate Limit responses with clean status and code', async () => {
      process.env.OPENROUTER_API_KEY = 'valid-key';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      }) as any;

      try {
        await askOpenRouter({ message: 'Hello', language: 'en' });
        expect.fail('Should have thrown rate limit error');
      } catch (err: any) {
        expect(err.status).toBe(429);
        expect(err.code).toBe('OPENROUTER_RATE_LIMIT');
        expect(err.message).toContain('rate limit');
      }
    });
  });

  describe('Document Extraction Support', () => {
    it('returns local unverified extraction when unconfigured', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const res = await analyzeDocumentWithOpenRouter({
        extractedText: 'Dag 104, Patta 52, Mirza Village, Kamrup',
        documentTitle: 'Jamabandi Copy',
        category: 'Jamabandi / Patta Extract (Demo)',
        language: 'en',
      });

      expect(res.aiAnalysis.status).toBe('Unverified Local Extraction');
      expect(res.aiAnalysis.extractedFields.documentTitle).toBe('Jamabandi Copy');
    });
  });
});
