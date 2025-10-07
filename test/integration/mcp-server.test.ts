import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { Readable, Writable } from 'stream';

describe('MCP Server Integration Tests', () => {
  let serverProcess: any;
  let serverInput: Writable;
  let serverOutput: Readable;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    process.env.OPENROUTER_MODEL = 'test-model';
    process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
  });

  afterEach(async () => {
    // Clean up server process
    if (serverProcess) {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  describe('Server Startup and Initialization', () => {
    it('should start server and register tools successfully', async () => {
      // This is a simplified integration test that mocks the external dependencies
      // In a real scenario, you'd want to test against a mock OpenRouter API

      // Import and test the main server logic with mocked dependencies
      const { main } = await import('../../src/index.js');

      // Mock the external dependencies
      vi.doMock('../../src/utils/openrouter-client.js', () => ({
        OpenRouterClient: {
          getInstance: vi.fn(() => ({
            testConnection: vi.fn().mockResolvedValue(true),
            validateModel: vi.fn().mockResolvedValue(true),
            analyzeImage: vi.fn().mockResolvedValue({
              success: true,
              analysis: 'Mock analysis result',
              model: 'test-model',
            }),
          })),
        },
      }));

      // Mock the transport to avoid actual stdio
      const mockTransport = {
        connect: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
        StdioServerTransport: vi.fn(() => mockTransport),
      }));

      // The server should start without throwing an error
      await expect(main()).resolves.not.toThrow();
    }, 10000);
  });

  describe('Tool List Endpoint', () => {
    it('should return correct tool definitions', async () => {
      // Mock the server initialization
      const mockServer = {
        setRequestHandler: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
        onerror: vi.fn(),
      };

      const mockTransport = {
        connect: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('@modelcontextprotocol/sdk/server/index.js', () => ({
        Server: vi.fn(() => mockServer),
      }));

      vi.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
        StdioServerTransport: vi.fn(() => mockTransport),
      }));

      // Mock OpenRouter client
      vi.doMock('../../src/utils/openrouter-client.js', () => ({
        OpenRouterClient: {
          getInstance: vi.fn(() => ({
            testConnection: vi.fn().mockResolvedValue(true),
            validateModel: vi.fn().mockResolvedValue(true),
          })),
        },
      }));

      // Start the server
      await import('../../src/index.js');

      // Find the ListToolsRequestSchema handler
      const listToolsHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[0].name === 'ListToolsRequest'
      );

      expect(listToolsHandler).toBeDefined();

      if (listToolsHandler) {
        const handler = listToolsHandler[1];
        const result = await handler({});

        expect(result).toHaveProperty('tools');
        expect(Array.isArray(result.tools)).toBe(true);
        expect(result.tools.length).toBeGreaterThan(0);

        // Check that all expected tools are present
        const toolNames = result.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('analyze_image');
        expect(toolNames).toContain('analyze_webpage_screenshot');
        expect(toolNames).toContain('analyze_mobile_app_screenshot');

        // Verify tool schemas
        const analyzeImageTool = result.tools.find((tool: any) => tool.name === 'analyze_image');
        expect(analyzeImageTool).toBeDefined();
        expect(analyzeImageTool.inputSchema).toBeDefined();
        expect(analyzeImageTool.inputSchema.properties).toBeDefined();
        expect(analyzeImageTool.inputSchema.properties.type).toBeDefined();
        expect(analyzeImageTool.inputSchema.properties.data).toBeDefined();
      }
    });
  });
});

describe('End-to-End Image Analysis Workflow', () => {
  // Mock OpenRouter API responses
  const mockImageAnalysisResponse = {
    choices: [
      {
        message: {
          content: 'This is a detailed analysis of the image showing various elements.',
        },
      },
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 100,
      total_tokens: 150,
    },
  };

  const mockWebpageAnalysisResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            layout: 'responsive',
            navigation: ['header', 'sidebar', 'footer'],
            interactive_elements: ['buttons', 'forms', 'links'],
            accessibility: {
              score: 0.8,
              issues: ['missing_alt_text'],
            },
          }),
        },
      },
    ],
  };

  const mockMobileAppAnalysisResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            platform: 'ios',
            design_system: 'human_interface_guidelines',
            ui_patterns: ['navigation_bar', 'tab_bar'],
            ux_heuristics: {
              navigation: 'excellent',
              feedback: 'good',
              consistency: 'excellent',
            },
          }),
        },
      },
    ],
  };

  beforeEach(() => {
    // Mock axios for OpenRouter API calls
    vi.mock('axios', () => ({
      create: vi.fn(() => ({
        get: vi.fn()
          .mockResolvedValueOnce({
            data: {
              data: [
                { id: 'test-model', architecture: { modality: ['vision', 'text'] } }
              ]
            }
          })
          .mockResolvedValue({ status: 200 }),
        post: vi.fn()
          .mockResolvedValueOnce(mockImageAnalysisResponse)
          .mockResolvedValueOnce(mockWebpageAnalysisResponse)
          .mockResolvedValueOnce(mockMobileAppAnalysisResponse),
      })),
    }));
  });

  it('should complete full image analysis workflow', async () => {
    // Test the complete workflow from tool call to response
    const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

    const mockServer = {
      setRequestHandler: vi.fn(),
    };

    // Mock dependencies
    vi.doMock('../../src/config/index.js', () => ({
      Config: {
        getInstance: vi.fn(() => ({
          getOpenRouterConfig: vi.fn(() => ({
            apiKey: 'test-key',
            model: 'test-model',
          })),
          getServerConfig: vi.fn(() => ({
            maxImageSize: 10485760,
          })),
        })),
      },
    }));

    vi.doMock('../../src/utils/openrouter-client.js', () => ({
      OpenRouterClient: {
        getInstance: vi.fn(() => ({
          analyzeImage: vi.fn().mockResolvedValue({
            success: true,
            analysis: 'This is a detailed analysis of the image.',
            model: 'test-model',
            usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
          }),
        })),
      },
    }));

    vi.doMock('../../src/utils/image-processor.js', () => ({
      ImageProcessor: {
        getInstance: vi.fn(() => ({
          processImage: vi.fn().mockResolvedValue({
            data: 'processedbase64',
            mimeType: 'image/png',
            size: 1000,
          }),
          isValidImageType: vi.fn(() => true),
        })),
      },
    }));

    vi.doMock('../../src/utils/logger.js', () => ({
      Logger: {
        getInstance: vi.fn(() => ({
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        })),
      },
    }));

    // Register the tool
    registerAnalyzeImageTool(mockServer);

    // Get the tool handler
    const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

    // Simulate a tool call from an AI agent
    const toolRequest = {
      params: {
        name: 'analyze_image',
        arguments: {
          type: 'base64',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          mimeType: 'image/png',
          prompt: 'Analyze this image for AI agent testing',
          format: 'text',
          maxTokens: 2000,
          temperature: 0.1,
        },
      },
    };

    const result = await toolHandler(toolRequest);

    // Verify the response
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    expect(typeof result.content[0].text).toBe('string');
    expect(result.content[0].text).toContain('detailed analysis');
    expect(result.isError).toBeUndefined();
  });

  it('should handle webpage screenshot analysis workflow', async () => {
    const { registerAnalyzeWebpageTool } = await import('../../src/tools/analyze-webpage.js');

    const mockServer = {
      setRequestHandler: vi.fn(),
    };

    // Mock dependencies (similar to above but for webpage tool)
    vi.doMock('../../src/config/index.js', () => ({
      Config: {
        getInstance: vi.fn(() => ({
          getOpenRouterConfig: vi.fn(() => ({
            apiKey: 'test-key',
            model: 'test-model',
          })),
          getServerConfig: vi.fn(() => ({
            maxImageSize: 10485760,
          })),
        })),
      },
    }));

    vi.doMock('../../src/utils/openrouter-client.js', () => ({
      OpenRouterClient: {
        getInstance: vi.fn(() => ({
          analyzeImage: vi.fn().mockResolvedValue({
            success: true,
            analysis: JSON.stringify({
              layout: 'responsive',
              navigation: ['header', 'sidebar'],
              interactive_elements: ['buttons', 'forms'],
            }),
            model: 'test-model',
          }),
        })),
      },
    }));

    vi.doMock('../../src/utils/image-processor.js', () => ({
      ImageProcessor: {
        getInstance: vi.fn(() => ({
          processImage: vi.fn().mockResolvedValue({
            data: 'processedbase64',
            mimeType: 'image/png',
            size: 5000,
          }),
          isValidImageType: vi.fn(() => true),
        })),
      },
    }));

    vi.doMock('../../src/utils/logger.js', () => ({
      Logger: {
        getInstance: vi.fn(() => ({
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        })),
      },
    }));

    registerAnalyzeWebpageTool(mockServer);
    const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

    const toolRequest = {
      params: {
        name: 'analyze_webpage_screenshot',
        arguments: {
          type: 'file',
          data: '/path/to/webpage-screenshot.png',
          focusArea: 'layout',
          includeAccessibility: true,
          format: 'json',
        },
      },
    };

    const result = await toolHandler(toolRequest);

    expect(result.content[0].text).toContain('layout');
    expect(result.content[0].text).toContain('responsive');
    expect(result.isError).toBeUndefined();
  });

  it('should handle mobile app screenshot analysis workflow', async () => {
    const { registerAnalyzeMobileAppTool } = await import('../../src/tools/analyze-mobile-app.js');

    const mockServer = {
      setRequestHandler: vi.fn(),
    };

    // Mock dependencies for mobile app tool
    vi.doMock('../../src/config/index.js', () => ({
      Config: {
        getInstance: vi.fn(() => ({
          getOpenRouterConfig: vi.fn(() => ({
            apiKey: 'test-key',
            model: 'test-model',
          })),
          getServerConfig: vi.fn(() => ({
            maxImageSize: 10485760,
          })),
        })),
      },
    }));

    vi.doMock('../../src/utils/openrouter-client.js', () => ({
      OpenRouterClient: {
        getInstance: vi.fn(() => ({
          analyzeImage: vi.fn().mockResolvedValue({
            success: true,
            analysis: JSON.stringify({
              platform: 'android',
              design_system: 'material_design',
              ui_patterns: ['floating_action_button', 'app_bar'],
            }),
            model: 'test-model',
          }),
        })),
      },
    }));

    vi.doMock('../../src/utils/image-processor.js', () => ({
      ImageProcessor: {
        getInstance: vi.fn(() => ({
          processImage: vi.fn().mockResolvedValue({
            data: 'processedbase64',
            mimeType: 'image/jpeg',
            size: 3000,
          }),
          isValidImageType: vi.fn(() => true),
        })),
      },
    }));

    vi.doMock('../../src/utils/logger.js', () => ({
      Logger: {
        getInstance: vi.fn(() => ({
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        })),
      },
    }));

    registerAnalyzeMobileAppTool(mockServer);
    const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

    const toolRequest = {
      params: {
        name: 'analyze_mobile_app_screenshot',
        arguments: {
          type: 'url',
          data: 'https://example.com/mobile-app-screenshot.jpg',
          platform: 'android',
          focusArea: 'ui-design',
          includeUXHeuristics: true,
          format: 'json',
        },
      },
    };

    const result = await toolHandler(toolRequest);

    expect(result.content[0].text).toContain('platform');
    expect(result.content[0].text).toContain('android');
    expect(result.content[0].text).toContain('material_design');
    expect(result.isError).toBeUndefined();
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle invalid image types gracefully', async () => {
    const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

    const mockServer = {
      setRequestHandler: vi.fn(),
    };

    // Mock dependencies to return invalid image type
    vi.doMock('../../src/config/index.js', () => ({
      Config: {
        getInstance: vi.fn(() => ({
          getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-model' })),
          getServerConfig: vi.fn(() => ({ maxImageSize: 10485760 })),
        })),
      },
    }));

    vi.doMock('../../src/utils/image-processor.js', () => ({
      ImageProcessor: {
        getInstance: vi.fn(() => ({
          processImage: vi.fn().mockResolvedValue({
            data: 'processedbase64',
            mimeType: 'application/pdf', // Invalid image type
            size: 1000,
          }),
          isValidImageType: vi.fn(() => false), // Returns false for PDF
        })),
      },
    }));

    vi.doMock('../../src/utils/logger.js', () => ({
      Logger: {
        getInstance: vi.fn(() => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() })),
      },
    }));

    registerAnalyzeImageTool(mockServer);
    const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

    const toolRequest = {
      params: {
        name: 'analyze_image',
        arguments: {
          type: 'base64',
          data: 'invalidbasedata',
          mimeType: 'application/pdf',
        },
      },
    };

    const result = await toolHandler(toolRequest);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error:');
    expect(result.content[0].text).toContain('Unsupported image type');
  });

  it('should handle oversized images gracefully', async () => {
    const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

    const mockServer = {
      setRequestHandler: vi.fn(),
    };

    // Mock dependencies to return oversized image
    vi.doMock('../../src/config/index.js', () => ({
      Config: {
        getInstance: vi.fn(() => ({
          getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-model' })),
          getServerConfig: vi.fn(() => ({ maxImageSize: 1024 })), // Very small limit
        })),
      },
    }));

    vi.doMock('../../src/utils/image-processor.js', () => ({
      ImageProcessor: {
        getInstance: vi.fn(() => ({
          processImage: vi.fn().mockResolvedValue({
            data: 'largedata',
            mimeType: 'image/png',
            size: 2048, // Exceeds limit of 1024
          }),
          isValidImageType: vi.fn(() => true),
        })),
      },
    }));

    vi.doMock('../../src/utils/logger.js', () => ({
      Logger: {
        getInstance: vi.fn(() => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() })),
      },
    }));

    registerAnalyzeImageTool(mockServer);
    const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

    const toolRequest = {
      params: {
        name: 'analyze_image',
        arguments: {
          type: 'base64',
          data: 'largedata',
        },
      },
    };

    const result = await toolHandler(toolRequest);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error:');
    expect(result.content[0].text).toContain('exceeds maximum allowed size');
  });

  it('should handle API failures gracefully', async () => {
    const { registerAnalyzeImageTool } = await import('../../src/tools/analyze-image.js');

    const mockServer = {
      setRequestHandler: vi.fn(),
    };

    // Mock dependencies to simulate API failure
    vi.doMock('../../src/config/index.js', () => ({
      Config: {
        getInstance: vi.fn(() => ({
          getOpenRouterConfig: vi.fn(() => ({ apiKey: 'test-key', model: 'test-model' })),
          getServerConfig: vi.fn(() => ({ maxImageSize: 10485760 })),
        })),
      },
    }));

    vi.doMock('../../src/utils/openrouter-client.js', () => ({
      OpenRouterClient: {
        getInstance: vi.fn(() => ({
          analyzeImage: vi.fn().mockResolvedValue({
            success: false,
            error: 'API rate limit exceeded',
          }),
        })),
      },
    }));

    vi.doMock('../../src/utils/image-processor.js', () => ({
      ImageProcessor: {
        getInstance: vi.fn(() => ({
          processImage: vi.fn().mockResolvedValue({
            data: 'processedbase64',
            mimeType: 'image/png',
            size: 1000,
          }),
          isValidImageType: vi.fn(() => true),
        })),
      },
    }));

    vi.doMock('../../src/utils/logger.js', () => ({
      Logger: {
        getInstance: vi.fn(() => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() })),
      },
    }));

    registerAnalyzeImageTool(mockServer);
    const toolHandler = mockServer.setRequestHandler.mock.calls[0][1];

    const toolRequest = {
      params: {
        name: 'analyze_image',
        arguments: {
          type: 'base64',
          data: 'testdata',
        },
      },
    };

    const result = await toolHandler(toolRequest);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error:');
    expect(result.content[0].text).toContain('API rate limit exceeded');
  });
});