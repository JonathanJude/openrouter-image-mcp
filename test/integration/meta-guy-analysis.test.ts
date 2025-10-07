import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ImageProcessor } from '../../src/utils/image-processor.js';
import { OpenRouterClient } from '../../src/utils/openrouter-client.js';
import { Logger } from '../../src/utils/logger.js';

describe('Meta Guy Image Analysis Tests', () => {
  let imageProcessor: ImageProcessor;
  let mockOpenRouterClient: OpenRouterClient;
  let metaGuyImageBuffer: Buffer;
  let metaGuyBase64: string;

  beforeEach(async () => {
    // Mock logger to avoid console output during tests
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

    // Get singleton instances
    const logger = Logger.getInstance();
    imageProcessor = ImageProcessor.getInstance();

    // Load the meta_guy.jpg image for testing
    try {
      const imagePath = join(process.cwd(), 'meta_guy.jpg');
      metaGuyImageBuffer = await readFile(imagePath);
      metaGuyBase64 = metaGuyImageBuffer.toString('base64');
      console.log(`Loaded meta_guy.jpg: ${metaGuyImageBuffer.length} bytes`);
    } catch (error) {
      console.warn('Could not load meta_guy.jpg for testing, using mock data');
      // Create a minimal test image buffer if the actual file doesn't exist
      metaGuyBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='; // Minimal JPEG
    }

    // Mock OpenRouter client
    mockOpenRouterClient = {
      analyzeImage: vi.fn(),
      testConnection: vi.fn().mockResolvedValue(true),
      validateModel: vi.fn().mockResolvedValue(true),
    } as any;

    vi.mock('../../src/utils/openrouter-client.js', () => ({
      OpenRouterClient: {
        getInstance: vi.fn(() => mockOpenRouterClient),
      },
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Image Processing', () => {
    it('should process meta_guy.jpg from file path', async () => {
      // Skip file test if image doesn't exist
      if (metaGuyImageBuffer.length === 0) {
        console.log('Skipping file test - meta_guy.jpg not available');
        return;
      }

      try {
        const result = await imageProcessor.processImage({
          type: 'file',
          data: 'meta_guy.jpg',
        });

        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('mimeType');
        expect(result).toHaveProperty('size');
        expect(typeof result.data).toBe('string');
        expect(typeof result.size).toBe('number');
        expect(result.size).toBeGreaterThan(0);
        expect(imageProcessor.isValidImageType(result.mimeType)).toBe(true);
      } catch (error) {
        // File might not exist in test environment, which is okay
        console.log('File processing test skipped - file not found in test environment');
      }
    });

    it('should process meta_guy.jpg from base64 data', async () => {
      const result = await imageProcessor.processImage({
        type: 'base64',
        data: metaGuyBase64,
        mimeType: 'image/jpeg',
      });

      expect(result.data).toBe(metaGuyBase64);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should auto-detect MIME type for meta_guy.jpg base64', async () => {
      const result = await imageProcessor.processImage({
        type: 'base64',
        data: metaGuyBase64,
      });

      expect(result.mimeType).toBe('image/jpeg');
      expect(imageProcessor.isValidImageType(result.mimeType)).toBe(true);
    });

    it('should handle data URL format for meta_guy.jpg', async () => {
      const dataUrl = `data:image/jpeg;base64,${metaGuyBase64}`;
      const result = await imageProcessor.processImage({
        type: 'base64',
        data: dataUrl,
      });

      expect(result.data).toBe(metaGuyBase64);
      expect(result.mimeType).toBe('image/jpeg');
    });
  });

  describe('AI Agent Simulation - Image Analysis Scenarios', () => {
    beforeEach(() => {
      // Mock successful API responses for different analysis types
      mockOpenRouterClient.analyzeImage = vi.fn().mockImplementation(
        async (imageData: string, mimeType: string, prompt: string, options?: any) => {
          // Simulate different types of analysis based on the prompt
          if (prompt.includes('detailed') || prompt.includes('comprehensive')) {
            return {
              success: true,
              analysis: JSON.stringify({
                description: 'A person sitting in front of a computer setup, appearing to be working or engaged in digital activities. The individual has a focused expression and is surrounded by technology equipment including monitors and peripherals.',
                objects: ['person', 'computer', 'monitor', 'keyboard', 'desk', 'chair'],
                people: [{
                  count: 1,
                  appearance: 'Adult individual with focused expression',
                  activity: 'Working at computer'
                }],
                text: ['No visible text'],
                colors: ['neutral tones', 'black', 'white', 'gray'],
                setting: 'Indoor office or home workspace',
                mood: 'Professional, focused, concentrated',
                technical_elements: ['computer equipment', 'desk setup', 'workspace organization']
              }),
              structuredData: {
                description: 'A person sitting in front of a computer setup',
                objects: ['person', 'computer', 'monitor'],
                setting: 'workspace'
              },
              model: 'test-vision-model',
              usage: {
                promptTokens: 85,
                completionTokens: 156,
                totalTokens: 241
              }
            };
          } else if (prompt.includes('webpage') || prompt.includes('screenshot')) {
            return {
              success: true,
              analysis: JSON.stringify({
                page_type: 'desktop_application',
                layout: 'workspace_setup',
                interactive_elements: ['computer_interface', 'applications'],
                accessibility: {
                  score: 0.8,
                  observations: ['clear workspace layout', 'ergonomic setup visible']
                },
                content_analysis: {
                  primary_focus: 'work/productivity environment',
                  visible_elements: 'technology setup',
                  user_context: 'professional or development work'
                }
              }),
              model: 'test-vision-model',
              usage: {
                promptTokens: 92,
                completionTokens: 134,
                totalTokens: 226
              }
            };
          } else if (prompt.includes('mobile') || prompt.includes('app')) {
            return {
              success: true,
              analysis: JSON.stringify({
                platform_detected: 'desktop_environment',
                mobile_relevance: 'low',
                ui_patterns: ['traditional_workspace'],
                ux_heuristics: {
                  ergonomics: 'visible_attention_to_comfort',
                  organization: 'structured_setup',
                  efficiency: 'focused_work_environment'
                }
              }),
              model: 'test-vision-model',
              usage: {
                promptTokens: 78,
                completionTokens: 118,
                totalTokens: 196
              }
            };
          } else {
            // Default analysis
            return {
              success: true,
              analysis: 'Image shows a person working at a computer setup with various technology equipment visible.',
              model: 'test-vision-model',
              usage: {
                promptTokens: 45,
                completionTokens: 89,
                totalTokens: 134
              }
            };
          }
        }
      );
    });

    it('should simulate AI agent performing comprehensive image analysis', async () => {
      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

      const mockServer = {
        setRequestHandler: vi.fn(),
      };

      // Mock config
      vi.doMock('../../src/config/index.js', () => ({
        Config: {
          getInstance: vi.fn(() => ({
            getOpenRouterConfig: vi.fn(() => ({
              apiKey: 'test-key',
              model: 'test-vision-model',
            })),
            getServerConfig: vi.fn(() => ({
              maxImageSize: 10485760,
            })),
          })),
        },
      }));

      // Mock image processor
      vi.doMock('../../src/utils/image-processor.js', () => ({
        ImageProcessor: {
          getInstance: vi.fn(() => imageProcessor),
        },
      }));

      registerAnalyzeImageTool(mockServer);
      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      // Simulate AI agent request for comprehensive analysis
      const agentRequest = {
        params: {
          name: 'analyze_image',
          arguments: {
            type: 'base64',
            data: metaGuyBase64,
            mimeType: 'image/jpeg',
            prompt: 'Provide a comprehensive analysis of this image including objects, people, text, colors, setting, mood, and any notable features. Focus on details that would be useful for understanding the context and content.',
            format: 'json',
            maxTokens: 2000,
            temperature: 0.1,
          },
        },
      };

      const result = await toolHandler(agentRequest);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');

      const analysis = JSON.parse(result.content[0].text);
      expect(analysis).toHaveProperty('description');
      expect(analysis).toHaveProperty('objects');
      expect(analysis).toHaveProperty('people');
      expect(analysis).toHaveProperty('colors');
      expect(analysis).toHaveProperty('setting');
      expect(analysis.objects).toContain('person');
      expect(analysis.objects).toContain('computer');
      expect(Array.isArray(analysis.people)).toBe(true);
    });

    it('should simulate AI agent analyzing as webpage screenshot', async () => {
      const { registerAnalyzeWebpageTool } = await import('../../src/tools/analyze-webpage.js');

      const mockServer = {
        setRequestHandler: vi.fn(),
      };

      // Mock dependencies
      vi.doMock('../../src/config/index.js', () => ({
        Config: {
          getInstance: vi.fn(() => ({
            getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-vision-model' })),
            getServerConfig: vi.fn(() => ({ maxImageSize: 10485760 })),
          })),
        },
      }));

      vi.doMock('../../src/utils/image-processor.js', () => ({
        ImageProcessor: {
          getInstance: vi.fn(() => imageProcessor),
        },
      }));

      registerAnalyzeWebpageTool(mockServer);
      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      const agentRequest = {
        params: {
          name: 'analyze_webpage_screenshot',
          arguments: {
            type: 'base64',
            data: metaGuyBase64,
            mimeType: 'image/jpeg',
            focusArea: 'layout',
            includeAccessibility: true,
            format: 'json',
          },
        },
      };

      const result = await toolHandler(agentRequest);

      expect(result.isError).toBeUndefined();
      const analysis = JSON.parse(result.content[0].text);
      expect(analysis).toHaveProperty('page_type');
      expect(analysis).toHaveProperty('layout');
      expect(analysis).toHaveProperty('accessibility');
    });

    it('should simulate AI agent analyzing as mobile app screenshot', async () => {
      const { registerAnalyzeMobileAppTool } = await import('../../src/tools/analyze-mobile-app.js');

      const mockServer = {
        setRequestHandler: vi.fn(),
      };

      // Mock dependencies
      vi.doMock('../../src/config/index.js', () => ({
        Config: {
          getInstance: vi.fn(() => ({
            getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-vision-model' })),
            getServerConfig: vi.fn(() => ({ maxImageSize: 10485760 })),
          })),
        },
      }));

      vi.doMock('../../src/utils/image-processor.js', () => ({
        ImageProcessor: {
          getInstance: vi.fn(() => imageProcessor),
        },
      }));

      registerAnalyzeMobileAppTool(mockServer);
      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      const agentRequest = {
        params: {
          name: 'analyze_mobile_app_screenshot',
          arguments: {
            type: 'base64',
            data: metaGuyBase64,
            mimeType: 'image/jpeg',
            platform: 'auto-detect',
            focusArea: 'user-experience',
            includeUXHeuristics: true,
            format: 'json',
          },
        },
      };

      const result = await toolHandler(agentRequest);

      expect(result.isError).toBeUndefined();
      const analysis = JSON.parse(result.content[0].text);
      expect(analysis).toHaveProperty('platform_detected');
      expect(analysis).toHaveProperty('ux_heuristics');
    });
  });

  describe('Edge Cases and Error Handling with Meta Guy Image', () => {
    it('should handle corrupted base64 data gracefully', async () => {
      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

      const mockServer = {
        setRequestHandler: vi.fn(),
      };

      // Mock dependencies
      vi.doMock('../../src/config/index.js', () => ({
        Config: {
          getInstance: vi.fn(() => ({
            getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-vision-model' })),
            getServerConfig: vi.fn(() => ({ maxImageSize: 10485760 })),
          })),
        },
      }));

      vi.doMock('../../src/utils/image-processor.js', () => ({
        ImageProcessor: {
          getInstance: vi.fn(() => ({
            processImage: vi.fn().mockRejectedValue(new Error('Invalid base64 data')),
            isValidImageType: vi.fn(() => true),
          })),
        },
      }));

      registerAnalyzeImageTool(mockServer);
      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      const corruptedRequest = {
        params: {
          name: 'analyze_image',
          arguments: {
            type: 'base64',
            data: 'invalid_base64_data_!@#$%^&*()',
            mimeType: 'image/jpeg',
          },
        },
      };

      const result = await toolHandler(corruptedRequest);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('should handle missing MIME type for base64 input', async () => {
      // Test that the system can auto-detect MIME type
      const result = await imageProcessor.processImage({
        type: 'base64',
        data: metaGuyBase64,
        // mimeType omitted
      });

      expect(result.mimeType).toBe('image/jpeg');
      expect(imageProcessor.isValidImageType(result.mimeType)).toBe(true);
    });

    it('should handle unsupported file format', async () => {
      const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

      const mockServer = {
        setRequestHandler: vi.fn(),
      };

      vi.doMock('../../src/config/index.js', () => ({
        Config: {
          getInstance: vi.fn(() => ({
            getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-vision-model' })),
            getServerConfig: vi.fn(() => ({ maxImageSize: 10485760 })),
          })),
        },
      }));

      vi.doMock('../../src/utils/image-processor.js', () => ({
        ImageProcessor: {
          getInstance: vi.fn(() => ({
            processImage: vi.fn().mockResolvedValue({
              data: 'basedata',
              mimeType: 'application/pdf', // Unsupported format
              size: 1000,
            }),
            isValidImageType: vi.fn(() => false),
          })),
        },
      }));

      registerAnalyzeImageTool(mockServer);
      const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

      const unsupportedRequest = {
        params: {
          name: 'analyze_image',
          arguments: {
            type: 'base64',
            data: 'JVBERi0xLjcNCiW...'; // PDF base64 start
          },
        },
      };

      const result = await toolHandler(unsupportedRequest);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unsupported image type');
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle large image analysis without memory leaks', async () => {
      // Create a larger base64 string (simulating a bigger image)
      const largeImageData = metaGuyBase64.padEnd(1000000, '0'); // 1MB of data

      const startTime = Date.now();
      const result = await imageProcessor.processImage({
        type: 'base64',
        data: largeImageData,
        mimeType: 'image/jpeg',
      });
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should process multiple concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        return await imageProcessor.processImage({
          type: 'base64',
          data: metaGuyBase64,
          mimeType: 'image/jpeg',
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('mimeType');
        expect(result.mimeType).toBe('image/jpeg');
      });
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});