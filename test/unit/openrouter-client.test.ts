import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import { OpenRouterClient } from '../../src/utils/openrouter-client.js';
import { Logger } from '../../src/utils/logger.js';
import type { OpenRouterConfig } from '../../src/types/index.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock Logger to avoid console output during tests
vi.mock('../../src/utils/logger.js', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

describe('OpenRouterClient', () => {
  let openRouterClient: OpenRouterClient;
  let mockAxiosInstance: any;
  let config: OpenRouterConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      apiKey: 'test-api-key',
      model: 'anthropic/claude-3.5-sonnet',
      baseUrl: 'https://openrouter.ai/api/v1',
    };

    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
    };

    mockedAxios.create = vi.fn(() => mockAxiosInstance);

    openRouterClient = OpenRouterClient.getInstance(config);
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Reset singleton instance
    (OpenRouterClient as any).instance = undefined;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const client1 = OpenRouterClient.getInstance(config);
      const client2 = OpenRouterClient.getInstance(config);
      expect(client1).toBe(client2);
    });

    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: config.baseUrl,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/openrouter-image-mcp',
          'X-Title': 'OpenRouter Image MCP',
        },
        timeout: 60000,
      });
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });

      const result = await openRouterClient.testConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models');
    });

    it('should return false for failed connection', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await openRouterClient.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('validateModel', () => {
    it('should return true for valid model that supports vision', async () => {
      const mockModels = [
        {
          id: 'anthropic/claude-3.5-sonnet',
          architecture: { modality: ['vision', 'text'] },
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockModels },
      });

      const result = await openRouterClient.validateModel('anthropic/claude-3.5-sonnet');

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });
    });

    it('should return true for model with vision capability', async () => {
      const mockModels = [
        {
          id: 'openai/gpt-4-vision-preview',
          capabilities: { vision: true },
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockModels },
      });

      const result = await openRouterClient.validateModel('openai/gpt-4-vision-preview');

      expect(result).toBe(true);
    });

    it('should return true for known vision models by name pattern', async () => {
      const mockModels = [
        { id: 'google/gemini-pro-vision' },
        { id: 'anthropic/claude-3-opus' },
        { id: 'some-other-vision-model' },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockModels },
      });

      const result1 = await openRouterClient.validateModel('google/gemini-pro-vision');
      const result2 = await openRouterClient.validateModel('anthropic/claude-3-opus');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false for model that does not exist', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: [] },
      });

      const result = await openRouterClient.validateModel('nonexistent-model');

      expect(result).toBe(false);
    });

    it('should return false for API error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API error'));

      const result = await openRouterClient.validateModel('any-model');

      expect(result).toBe(false);
    });
  });

  describe('analyzeImage', () => {
    const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const mockMimeType = 'image/png';
    const mockPrompt = 'Analyze this image';

    it('should successfully analyze image with text response', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is a detailed analysis of the image.',
              },
            },
          ],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 100,
            total_tokens: 150,
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt);

      expect(result.success).toBe(true);
      expect(result.analysis).toBe('This is a detailed analysis of the image.');
      expect(result.model).toBe(config.model);
      expect(result.usage).toEqual({
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/chat/completions', {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: mockPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mockMimeType};base64,${mockImageData}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: undefined,
      });
    });

    it('should successfully analyze image with JSON response', async () => {
      const mockJsonResponse = {
        data: {
          choices: [
            {
              message: {
                content: '{"objects": ["person", "car"], "colors": ["red", "blue"]}',
              },
            },
          ],
          usage: {
            prompt_tokens: 30,
            completion_tokens: 80,
            total_tokens: 110,
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockJsonResponse);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt, {
        format: 'json',
        maxTokens: 2000,
        temperature: 0.5,
      });

      expect(result.success).toBe(true);
      expect(result.analysis).toBe(JSON.stringify({ objects: ['person', 'car'], colors: ['red', 'blue'] }, null, 2));
      expect(result.structuredData).toEqual({ objects: ['person', 'car'], colors: ['red', 'blue'] });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/chat/completions', {
        model: config.model,
        messages: expect.any(Array),
        max_tokens: 2000,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });
    });

    it('should handle JSON parsing gracefully', async () => {
      const mockInvalidJsonResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is not valid JSON, but should be handled gracefully',
              },
            },
          ],
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockInvalidJsonResponse);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt, {
        format: 'json',
      });

      expect(result.success).toBe(true);
      expect(result.analysis).toBe('This is not valid JSON, but should be handled gracefully');
      expect(result.structuredData).toEqual({ analysis: 'This is not valid JSON, but should be handled gracefully' });
    });

    it('should handle empty response from model', async () => {
      const mockEmptyResponse = {
        data: {
          choices: [],
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockEmptyResponse);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No response from model');
    });

    it('should handle empty message content', async () => {
      const mockEmptyContentResponse = {
        data: {
          choices: [
            {
              message: {},
            },
          ],
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockEmptyContentResponse);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty response from model');
    });

    it('should handle axios errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid API key',
            },
          },
        },
        message: 'Request failed with status code 401',
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.post.mockRejectedValue(axiosError);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt);

      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenRouter API Error: Invalid API key');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');

      mockAxiosInstance.post.mockRejectedValue(genericError);

      const result = await openRouterClient.analyzeImage(mockImageData, mockMimeType, mockPrompt);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('should use default prompt when none provided', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Default analysis',
              },
            },
          ],
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await openRouterClient.analyzeImage(mockImageData, mockMimeType, '');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/chat/completions', {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image in detail. Describe what you see, including objects, people, text, and any notable features.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mockMimeType};base64,${mockImageData}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: undefined,
      });
    });
  });
});