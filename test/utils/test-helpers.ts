import { ImageInput } from '../../src/types/index.js';

/**
 * Test utility functions for image analysis testing
 */
export class TestHelpers {
  /**
   * Creates a mock image input for testing
   */
  static createMockImageInput(overrides: Partial<ImageInput> = {}): ImageInput {
    return {
      type: 'base64',
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      ...overrides,
    };
  }

  /**
   * Creates a mock OpenRouter API response
   */
  static createMockAPIResponse(overrides: any = {}) {
    return {
      data: {
        choices: [
          {
            message: {
              content: 'Mock image analysis response',
            },
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 100,
          total_tokens: 150,
        },
      },
      ...overrides,
    };
  }

  /**
   * Creates a mock analysis result
   */
  static createMockAnalysisResult(overrides: any = {}) {
    return {
      success: true,
      analysis: 'Mock analysis result',
      model: 'test-model',
      usage: {
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150,
      },
      ...overrides,
    };
  }

  /**
   * Creates mock image processing result
   */
  static createMockProcessedImage(overrides: any = {}) {
    return {
      data: 'mockbase64data',
      mimeType: 'image/png',
      size: 1000,
      ...overrides,
    };
  }

  /**
   * Creates mock tool request
   */
  static createMockToolRequest(toolName: string, args: any = {}) {
    return {
      params: {
        name: toolName,
        arguments: args,
      },
    };
  }

  /**
   * Creates mock server response
   */
  static createMockServerResponse(content: string, isError = false) {
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
      isError,
    };
  }

  /**
   * Sample base64 encoded images for testing
   */
  static readonly SAMPLE_IMAGES = {
    // 1x1 red pixel PNG
    RED_PNG: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',

    // 1x1 blue pixel PNG
    BLUE_PNG: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',

    // Minimal JPEG
    MINIMAL_JPEG: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA==',
  };

  /**
   * Various test prompts
   */
  static readonly TEST_PROMPTS = {
    BASIC: 'Analyze this image',
    DETAILED: 'Provide a comprehensive analysis of this image including objects, people, text, colors, setting, mood, and any notable features.',
    WEBPAGE: 'Analyze this webpage screenshot. Extract content, layout information, and interactive elements.',
    MOBILE: 'Analyze this mobile app screenshot. Provide insights into UI design, user experience, and platform conventions.',
    ACCESSIBILITY: 'Evaluate this image for accessibility issues and provide recommendations for improvement.',
  };

  /**
   * Common test scenarios
   */
  static readonly TEST_SCENARIOS = {
    VALID_INPUTS: [
      { type: 'base64', data: 'validbase64', mimeType: 'image/png' },
      { type: 'file', data: '/path/to/image.jpg' },
      { type: 'url', data: 'https://example.com/image.png' },
    ],

    INVALID_INPUTS: [
      { type: 'invalid', data: 'data' },
      { type: 'base64', data: '' },
      { type: 'file', data: '' },
      { type: 'url', data: 'invalid-url' },
    ],

    INVALID_MIME_TYPES: [
      'application/pdf',
      'text/plain',
      'video/mp4',
      'audio/mp3',
      'application/zip',
    ],

    VALID_MIME_TYPES: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  };

  /**
   * Performance testing utilities
   */
  static async measurePerformance<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    console.log(`${label}: ${duration}ms`);
    return { result, duration };
  }

  /**
   * Memory usage utilities
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  static logMemoryUsage(label: string): void {
    const usage = this.getMemoryUsage();
    console.log(`${label} Memory Usage:`, {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    });
  }
}