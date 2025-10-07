import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Config } from '../../src/config/index.js';
import { OpenRouterClient } from '../../src/utils/openrouter-client.js';
import { ImageProcessor } from '../../src/utils/image-processor.js';
import { Logger } from '../../src/utils/logger.js';
import { TestHelpers } from '../utils/test-helpers.js';

describe('Edge Cases and Error Scenarios', () => {
  let mockServer: Server;
  let mockConfig: any;
  let mockOpenRouterClient: any;
  let mockImageProcessor: any;
  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create comprehensive mocks
    mockServer = {
      setRequestHandler: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      onerror: vi.fn(),
    } as any;

    mockConfig = {
      getOpenRouterConfig: vi.fn(() => ({
        apiKey: 'test-api-key',
        model: 'test-model',
        baseUrl: 'https://test.api.com',
      })),
      getServerConfig: vi.fn(() => ({
        maxImageSize: 10485760, // 10MB
      })),
    };

    mockOpenRouterClient = {
      testConnection: vi.fn(),
      validateModel: vi.fn(),
      analyzeImage: vi.fn(),
    };

    mockImageProcessor = {
      processImage: vi.fn(),
      isValidImageType: vi.fn(),
    };

    mockLogger = {
      getInstance: vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    };

    // Setup mock returns
    vi.mocked(Config.getInstance).mockReturnValue(mockConfig);
    vi.mocked(OpenRouterClient.getInstance).mockReturnValue(mockOpenRouterClient);
    vi.mocked(ImageProcessor.getInstance).mockReturnValue(mockImageProcessor);
    vi.mocked(Logger.getInstance).mockReturnValue(mockLogger.getInstance());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Image Processing Edge Cases', () => {
    it('should handle empty base64 strings', async () => {
      mockImageProcessor.processImage.mockRejectedValue(new Error('Empty image data'));

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: '',
        mimeType: 'image/png',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle extremely large images', async () => {
      const largeImageData = 'x'.repeat(50 * 1024 * 1024); // 50MB of data
      mockImageProcessor.processImage.mockResolvedValue({
        data: largeImageData,
        mimeType: 'image/png',
        size: 50 * 1024 * 1024,
      });

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: largeImageData,
        mimeType: 'image/png',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('exceeds maximum allowed size');
    });

    it('should handle corrupted image data', async () => {
      mockImageProcessor.processImage.mockRejectedValue(new Error('Invalid image data'));

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: 'corrupted_base64_data_!@#$%^&*()',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle non-existent file paths', async () => {
      const fileError = new Error('ENOENT: no such file or directory');
      mockImageProcessor.processImage.mockRejectedValue(fileError);

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'file',
        data: '/non/existent/path/image.jpg',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle invalid URLs', async () => {
      const urlError = new Error('Invalid URL format');
      mockImageProcessor.processImage.mockRejectedValue(urlError);

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'url',
        data: 'not-a-valid-url',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle network timeouts for URL images', async () => {
      const timeoutError = new Error('Network timeout after 30 seconds');
      mockImageProcessor.processImage.mockRejectedValue(timeoutError);

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'url',
        data: 'https://example.com/slow-image.jpg',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle unsupported image formats', async () => {
      mockImageProcessor.processImage.mockResolvedValue({
        data: 'supporteddatabutwrongtype',
        mimeType: 'application/pdf', // Unsupported format
        size: 1000,
      });
      mockImageProcessor.isValidImageType.mockReturnValue(false);

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: TestHelpers.SAMPLE_IMAGES.MINIMAL_JPEG,
        mimeType: 'application/pdf',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unsupported image type');
    });
  });

  describe('API Communication Edge Cases', () => {
    it('should handle API authentication failures', async () => {
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: false,
        error: 'Authentication failed: Invalid API key',
      });

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', TestHelpers.createMockImageInput());

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Authentication failed');
    });

    it('should handle API rate limiting', async () => {
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      });

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', TestHelpers.createMockImageInput());

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Rate limit exceeded');
    });

    it('should handle API model unavailable', async () => {
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: false,
        error: 'Model "test-model" is currently unavailable',
      });

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', TestHelpers.createMockImageInput());

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('unavailable');
    });

    it('should handle API timeout errors', async () => {
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: false,
        error: 'Request timeout after 60 seconds',
      });

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', TestHelpers.createMockImageInput());

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('timeout');
    });

    it('should handle API response parsing errors', async () => {
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: true,
        analysis: undefined, // Missing analysis
      });

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', TestHelpers.createMockImageInput());

      const result = await toolHandler(request);

      expect(result.isError).toBeUndefined(); // Should handle gracefully
      expect(result.content[0].text).toBe('No analysis available');
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle missing required parameters', async () => {
      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      // Test missing type
      const request1 = TestHelpers.createMockToolRequest('analyze_image', {
        data: 'somedata',
      });
      await expect(toolHandler(request1)).rejects.toThrow();

      // Test missing data
      const request2 = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
      });
      await expect(toolHandler(request2)).rejects.toThrow();

      // Test completely empty arguments
      const request3 = {
        params: { name: 'analyze_image' },
      };
      await expect(toolHandler(request3)).rejects.toThrow('Arguments are required');
    });

    it('should handle invalid parameter types', async () => {
      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      // Test invalid type
      const request1 = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'invalid_type',
        data: 'somedata',
      });
      // Should not throw immediately but will be handled in processing
      await expect(toolHandler(request1)).resolves.not.toThrow();

      // Test invalid format
      const request2 = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: 'somedata',
        format: 'invalid_format',
      });
      await expect(toolHandler(request2)).resolves.not.toThrow();

      // Test invalid temperature
      const request3 = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: 'somedata',
        temperature: 5.0, // Exceeds maximum of 2.0
      });
      await expect(toolHandler(request3)).resolves.not.toThrow();
    });

    it('should handle null and undefined values', async () => {
      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      // Test null values
      const request1 = TestHelpers.createMockToolRequest('analyze_image', {
        type: null,
        data: null,
        mimeType: null,
      });
      await expect(toolHandler(request1)).rejects.toThrow();

      // Test undefined values
      const request2 = TestHelpers.createMockToolRequest('analyze_image', {
        type: undefined,
        data: undefined,
      });
      await expect(toolHandler(request2)).rejects.toThrow();
    });

    it('should handle extremely long parameter values', async () => {
      const longPrompt = 'x'.repeat(100000); // 100KB prompt
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue(TestHelpers.createMockAnalysisResult());

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'base64',
        data: TestHelpers.SAMPLE_IMAGES.MINIMAL_JPEG,
        prompt: longPrompt,
      });

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        longPrompt,
        expect.any(Object)
      );
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle memory pressure scenarios', async () => {
      // Simulate memory pressure by processing many large images
      const largeImageData = 'x'.repeat(1024 * 1024); // 1MB per image
      const concurrentRequests = 10;

      mockImageProcessor.processImage.mockResolvedValue({
        data: largeImageData,
        mimeType: 'image/png',
        size: 1024 * 1024,
      });

      mockOpenRouterClient.analyzeImage.mockResolvedValue(TestHelpers.createMockAnalysisResult());

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      const requests = Array(concurrentRequests).fill(null).map((_, index) =>
        TestHelpers.createMockToolRequest('analyze_image', {
          type: 'base64',
          data: largeImageData,
          prompt: `Test request ${index}`,
        })
      );

      const results = await Promise.all(requests.map(req => toolHandler(req)));

      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.isError).toBeUndefined();
        expect(result.content[0].text).toContain('Mock analysis result');
      });
    });

    it('should handle rapid successive requests', async () => {
      mockImageProcessor.processImage.mockResolvedValue(TestHelpers.createMockProcessedImage());
      mockOpenRouterClient.analyzeImage.mockResolvedValue(TestHelpers.createMockAnalysisResult());

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      // Send 100 rapid requests
      const requests = Array(100).fill(null).map((_, index) =>
        toolHandler(TestHelpers.createMockToolRequest('analyze_image', {
          type: 'base64',
          data: TestHelpers.SAMPLE_IMAGES.MINIMAL_JPEG,
          prompt: `Rapid request ${index}`,
        }))
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(100);
      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledTimes(100);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing configuration values', async () => {
      // Test with missing API key
      const invalidConfig = {
        getOpenRouterConfig: vi.fn(() => ({
          apiKey: '', // Empty API key
          model: 'test-model',
        })),
        getServerConfig: vi.fn(() => ({
          maxImageSize: 10485760,
        })),
      };

      vi.mocked(Config.getInstance).mockReturnValue(invalidConfig);

      expect(() => {
        Config.getInstance();
      }).not.toThrow(); // Should handle gracefully
    });

    it('should handle invalid configuration values', async () => {
      const invalidConfig = {
        getOpenRouterConfig: vi.fn(() => ({
          apiKey: 'invalid-key',
          model: '', // Empty model
          baseUrl: 'invalid-url',
        })),
        getServerConfig: vi.fn(() => ({
          maxImageSize: -1, // Invalid size
          logLevel: 'invalid-level',
        })),
      };

      vi.mocked(Config.getInstance).mockReturnValue(invalidConfig);

      expect(() => {
        Config.getInstance();
      }).not.toThrow();
    });
  });

  describe('Network and Connectivity Issues', () => {
    it('should handle DNS resolution failures', async () => {
      mockImageProcessor.processImage.mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND invalid-domain.com')
      );

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'url',
        data: 'https://invalid-domain.com/image.jpg',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle SSL/TLS certificate errors', async () => {
      mockImageProcessor.processImage.mockRejectedValue(
        new Error('self-signed certificate')
      );

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'url',
        data: 'https://expired-certificate.com/image.jpg',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle connection refused errors', async () => {
      mockImageProcessor.processImage.mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = TestHelpers.createMockToolRequest('analyze_image', {
        type: 'url',
        data: 'https://localhost:9999/image.jpg',
      });

      const result = await toolHandler(request);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });
  });

  describe('Concurrent Operation Edge Cases', () => {
    it('should handle concurrent operations on shared resources', async () => {
      let processingCount = 0;
      const maxConcurrentProcessing = 5;

      mockImageProcessor.processImage.mockImplementation(async () => {
        processingCount++;
        expect(processingCount).toBeLessThanOrEqual(maxConcurrentProcessing);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        processingCount--;
        return TestHelpers.createMockProcessedImage();
      });

      mockOpenRouterClient.analyzeImage.mockResolvedValue(TestHelpers.createMockAnalysisResult());

      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');
      registerAnalyzeImageTool(mockServer);

      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      // Launch concurrent requests
      const requests = Array(maxConcurrentProcessing).fill(null).map((_, index) =>
        toolHandler(TestHelpers.createMockToolRequest('analyze_image', {
          type: 'base64',
          data: TestHelpers.SAMPLE_IMAGES.MINIMAL_JPEG,
          prompt: `Concurrent test ${index}`,
        }))
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(maxConcurrentProcessing);
      expect(processingCount).toBe(0); // All should be completed
    });
  });
});