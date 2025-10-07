import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerAnalyzeWebpageTool } from '../../src/tools/analyze-webpage.js';
import { Config } from '../../src/config/index.js';
import { OpenRouterClient } from '../../src/utils/openrouter-client.js';
import { ImageProcessor } from '../../src/utils/image-processor.js';
import { Logger } from '../../src/utils/logger.js';

// Mock dependencies
vi.mock('../../src/config/index.js');
vi.mock('../../src/utils/openrouter-client.js');
vi.mock('../../src/utils/image-processor.js');
vi.mock('../../src/utils/logger.js');

const MockedConfig = vi.mocked(Config);
const MockedOpenRouterClient = vi.mocked(OpenRouterClient);
const MockedImageProcessor = vi.mocked(ImageProcessor);
const MockedLogger = vi.mocked(Logger);

describe('registerAnalyzeWebpageTool', () => {
  let mockServer: any;
  let mockConfig: any;
  let mockOpenRouterClient: any;
  let mockImageProcessor: any;
  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mocks
    mockServer = {
      setRequestHandler: vi.fn(),
    };

    mockConfig = {
      getOpenRouterConfig: vi.fn(() => ({
        apiKey: 'test-api-key',
        model: 'test-model',
      })),
      getServerConfig: vi.fn(() => ({
        maxImageSize: 10485760,
      })),
    };

    mockOpenRouterClient = {
      analyzeImage: vi.fn(),
    };

    mockImageProcessor = {
      processImage: vi.fn(),
      isValidImageType: vi.fn(() => true),
    };

    mockLogger = {
      getInstance: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    };

    // Setup mock returns
    MockedConfig.getInstance = vi.fn(() => mockConfig);
    MockedOpenRouterClient.getInstance = vi.fn(() => mockOpenRouterClient);
    MockedImageProcessor.getInstance = vi.fn(() => mockImageProcessor);
    MockedLogger.getInstance = mockLogger.getInstance;

    // Register the tool
    registerAnalyzeWebpageTool(mockServer);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('tool registration', () => {
    it('should register the tool handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function)
      );
    });
  });

  describe('tool handler', () => {
    let toolHandler: any;

    beforeEach(() => {
      // Get the registered handler
      const handlerCall = mockServer.setRequestHandler.mock.calls[0];
      toolHandler = handlerCall[1];
    });

    it('should successfully analyze webpage screenshot with default settings', async () => {
      const mockProcessedImage = {
        data: 'base64screenshot',
        mimeType: 'image/png',
        size: 5000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"layout": "responsive", "interactive_elements": ["button", "form"]}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/screenshot.png',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64screenshot',
        'image/png',
        expect.stringContaining('Analyze this webpage screenshot and provide detailed information about its structure, content, and design'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"layout": "responsive", "interactive_elements": ["button", "form"]}',
          },
        ],
      });
    });

    it('should analyze webpage with specific focus area', async () => {
      const mockProcessedImage = {
        data: 'base64screenshot',
        mimeType: 'image/jpeg',
        size: 4000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"navigation_elements": ["menu", "breadcrumbs"], "structure": "hierarchical"}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/screenshot.jpg',
            focusArea: 'navigation',
            includeAccessibility: false,
            format: 'json',
            maxTokens: 3000,
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64screenshot',
        'image/jpeg',
        expect.stringContaining('Focus specifically on navigation elements, menus, breadcrumbs, and user pathways'),
        {
          format: 'json',
          maxTokens: 3000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"navigation_elements": ["menu", "breadcrumbs"], "structure": "hierarchical"}',
          },
        ],
      });
    });

    it('should analyze webpage with accessibility analysis enabled', async () => {
      const mockProcessedImage = {
        data: 'base64screenshot',
        mimeType: 'image/png',
        size: 6000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"accessibility_issues": ["missing_alt_text", "poor_color_contrast"], "score": 0.7}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'base64',
            data: 'base64data',
            mimeType: 'image/png',
            focusArea: 'accessibility',
            includeAccessibility: true,
            format: 'json',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64screenshot',
        'image/png',
        expect.stringContaining('accessibility'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"accessibility_issues": ["missing_alt_text", "poor_color_contrast"], "score": 0.7}',
          },
        ],
      });
    });

    it('should analyze webpage with different focus areas', async () => {
      const focusAreas = ['layout', 'content', 'forms', 'interactive'];
      const mockProcessedImage = {
        data: 'base64screenshot',
        mimeType: 'image/png',
        size: 5000,
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: true,
        analysis: 'Analysis complete',
        model: 'test-model',
      });

      for (const focusArea of focusAreas) {
        const request = {
          params: {
            name: 'analyze_webpage_screenshot',
            arguments: {
              type: 'file',
              data: '/path/to/screenshot.png',
              focusArea,
            },
          },
        };

        await toolHandler(request);

        expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
          'base64screenshot',
          'image/png',
          expect.stringContaining(focusArea),
          { format: 'json', maxTokens: 4000 }
        );
      }
    });

    it('should handle text format output', async () => {
      const mockProcessedImage = {
        data: 'base64screenshot',
        mimeType: 'image/png',
        size: 5000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: 'The webpage has a clean layout with clear navigation hierarchy.',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/screenshot.png',
            format: 'text',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64screenshot',
        'image/png',
        expect.stringContaining('Analyze this webpage screenshot and provide detailed information about its structure, content, and design'),
        {
          format: 'text',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'The webpage has a clean layout with clear navigation hierarchy.',
          },
        ],
      });
    });

    it('should handle URL input for webpage screenshots', async () => {
      const mockProcessedImage = {
        data: 'base64fromurl',
        mimeType: 'image/webp',
        size: 7000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"webpage_type": "e-commerce", "conversion_elements": ["add_to_cart", "checkout"]}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'url',
            data: 'https://example.com/screenshot.webp',
            focusArea: 'interactive',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockImageProcessor.processImage).toHaveBeenCalledWith({
        type: 'url',
        data: 'https://example.com/screenshot.webp',
        mimeType: undefined,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"webpage_type": "e-commerce", "conversion_elements": ["add_to_cart", "checkout"]}',
          },
        ],
      });
    });

    it('should reject unknown tool names', async () => {
      const request = {
        params: {
          name: 'unknown_webpage_tool',
          arguments: {},
        },
      };

      await expect(toolHandler(request)).rejects.toThrow('Unknown tool: unknown_webpage_tool');
    });

    it('should reject requests without arguments', async () => {
      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
        },
      };

      await expect(toolHandler(request)).rejects.toThrow('Arguments are required');
    });

    it('should handle analysis errors gracefully', async () => {
      const mockProcessedImage = {
        data: 'base64screenshot',
        mimeType: 'image/png',
        size: 5000,
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: false,
        error: 'Webpage analysis failed',
      });

      const request = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/screenshot.png',
          },
        },
      };

      const result = await toolHandler(request);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Webpage analysis failed',
          },
        ],
        isError: true,
      });
    });
  });
});