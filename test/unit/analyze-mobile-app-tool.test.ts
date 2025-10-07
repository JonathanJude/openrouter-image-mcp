import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerAnalyzeMobileAppTool } from '../../src/tools/analyze-mobile-app.js';
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

describe('registerAnalyzeMobileAppTool', () => {
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
    registerAnalyzeMobileAppTool(mockServer);
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

    it('should successfully analyze mobile app screenshot with default settings', async () => {
      const mockProcessedImage = {
        data: 'base64mobile',
        mimeType: 'image/png',
        size: 3000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"platform": "ios", "ui_patterns": ["navigation_bar", "tab_bar"]}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/mobile-screenshot.png',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64mobile',
        'image/png',
        expect.stringContaining('mobile app screenshot'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"platform": "ios", "ui_patterns": ["navigation_bar", "tab_bar"]}',
          },
        ],
      });
    });

    it('should analyze mobile app with iOS platform specified', async () => {
      const mockProcessedImage = {
        data: 'base64ios',
        mimeType: 'image/jpeg',
        size: 2500,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"platform": "ios", "ios_elements": ["navigation_bar", "safe_area"], "design_system": "human_interface_guidelines"}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/ios-screenshot.jpg',
            platform: 'ios',
            focusArea: 'ui-design',
            format: 'json',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64ios',
        'image/jpeg',
        expect.stringContaining('ios platform conventions and design patterns'),
        expect.stringContaining('UI design elements'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"platform": "ios", "ios_elements": ["navigation_bar", "safe_area"], "design_system": "human_interface_guidelines"}',
          },
        ],
      });
    });

    it('should analyze mobile app with Android platform specified', async () => {
      const mockProcessedImage = {
        data: 'base64android',
        mimeType: 'image/webp',
        size: 3500,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"platform": "android", "material_design": true, "components": ["floating_action_button", "app_bar"]}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'base64',
            data: 'base64data',
            mimeType: 'image/webp',
            platform: 'android',
            focusArea: 'navigation',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64android',
        'image/webp',
        expect.stringContaining('android platform conventions and design patterns'),
        expect.stringContaining('navigation patterns'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"platform": "android", "material_design": true, "components": ["floating_action_button", "app_bar"]}',
          },
        ],
      });
    });

    it('should analyze mobile app with auto-detect platform', async () => {
      const mockProcessedImage = {
        data: 'base64auto',
        mimeType: 'image/png',
        size: 2800,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"platform": "android", "ui_heuristics": {"gestures": ["swipe", "tap"], "accessibility": "good"}}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/auto-detect.png',
            platform: 'auto-detect',
            includeUXHeuristics: true,
            focusArea: 'user-experience',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64auto',
        'image/png',
        expect.stringContaining('mobile app screenshot'),
        expect.stringContaining('user experience'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"platform": "android", "ui_heuristics": {"gestures": ["swipe", "tap"], "accessibility": "good"}}',
          },
        ],
      });
    });

    it('should analyze mobile app with different focus areas', async () => {
      const focusAreas = ['ui-design', 'user-experience', 'navigation', 'accessibility', 'performance', 'onboarding'];
      const mockProcessedImage = {
        data: 'base64mobile',
        mimeType: 'image/png',
        size: 3000,
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
            name: 'analyze_mobile_app_screenshot',
            arguments: {
              type: 'file',
              data: '/path/to/mobile-screenshot.png',
              platform: 'ios',
              focusArea,
            },
          },
        };

        await toolHandler(request);

        expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
          'base64mobile',
          'image/png',
          expect.stringContaining('iOS mobile app'),
          expect.stringContaining(focusArea),
          {
            format: 'json',
            maxTokens: 4000,
          }
        );
      }
    });

    it('should handle UX heuristics disabled', async () => {
      const mockProcessedImage = {
        data: 'base64mobile',
        mimeType: 'image/png',
        size: 3000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"platform": "android", "basic_ui": ["buttons", "text_fields"]}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/mobile-screenshot.png',
            platform: 'android',
            includeUXHeuristics: false,
            focusArea: 'ui-design',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64mobile',
        'image/png',
        expect.stringContaining('mobile app screenshot'),
        expect.stringContaining('UI design'),
        {
          format: 'json',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"platform": "android", "basic_ui": ["buttons", "text_fields"]}',
          },
        ],
      });
    });

    it('should handle text format output', async () => {
      const mockProcessedImage = {
        data: 'base64mobile',
        mimeType: 'image/png',
        size: 3000,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: 'The mobile app follows Material Design principles with a clean layout and intuitive navigation.',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/mobile-screenshot.png',
            platform: 'android',
            format: 'text',
            focusArea: 'accessibility',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockOpenRouterClient.analyzeImage).toHaveBeenCalledWith(
        'base64mobile',
        'image/png',
        expect.stringContaining('mobile app screenshot'),
        expect.stringContaining('accessibility'),
        {
          format: 'text',
          maxTokens: 4000,
        }
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'The mobile app follows Material Design principles with a clean layout and intuitive navigation.',
          },
        ],
      });
    });

    it('should handle URL input for mobile app screenshots', async () => {
      const mockProcessedImage = {
        data: 'base64fromurl',
        mimeType: 'image/jpeg',
        size: 3200,
      };

      const mockAnalysisResult = {
        success: true,
        analysis: '{"platform": "ios", "app_type": "social_media", "engagement_features": ["likes", "shares"]}',
        model: 'test-model',
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue(mockAnalysisResult);

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'url',
            data: 'https://example.com/mobile-app-screenshot.jpg',
            platform: 'ios',
            focusArea: 'onboarding',
          },
        },
      };

      const result = await toolHandler(request);

      expect(mockImageProcessor.processImage).toHaveBeenCalledWith({
        type: 'url',
        data: 'https://example.com/mobile-app-screenshot.jpg',
        mimeType: undefined,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"platform": "ios", "app_type": "social_media", "engagement_features": ["likes", "shares"]}',
          },
        ],
      });
    });

    it('should reject unknown tool names', async () => {
      const request = {
        params: {
          name: 'unknown_mobile_tool',
          arguments: {},
        },
      };

      await expect(toolHandler(request)).rejects.toThrow('Unknown tool: unknown_mobile_tool');
    });

    it('should reject requests without arguments', async () => {
      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
        },
      };

      await expect(toolHandler(request)).rejects.toThrow('Arguments are required');
    });

    it('should handle analysis errors gracefully', async () => {
      const mockProcessedImage = {
        data: 'base64mobile',
        mimeType: 'image/png',
        size: 3000,
      };

      mockImageProcessor.processImage.mockResolvedValue(mockProcessedImage);
      mockOpenRouterClient.analyzeImage.mockResolvedValue({
        success: false,
        error: 'Mobile app analysis failed',
      });

      const request = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'file',
            data: '/path/to/mobile-screenshot.png',
          },
        },
      };

      const result = await toolHandler(request);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Mobile app analysis failed',
          },
        ],
        isError: true,
      });
    });
  });
});